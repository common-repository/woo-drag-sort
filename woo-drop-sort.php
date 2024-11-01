<?php

/**
 *
 * @package   WooCommerce Drag Sort
 * @author    Abdelrahman Ashour < abdelrahman.ashour38@gmail.com >
 * @license   GPL-2.0+
 * @copyright 2018 Ash0ur


 * Plugin Name:  WooCommerce Drag Sort
 * Description:  A plugin that allows users to drag and drop products in minicart and also sort products in the cart table or in the minicart.
 * Version:      1.0.0
 * Author:       Abdelrahman Ashour
 * Author URI:   https://profiles.wordpress.org/ashour
 * License:      GPL2
 * License URI:  https://www.gnu.org/licenses/gpl-2.0.html
 */

if ( ! defined( 'ABSPATH' ) ) {
		exit;
}


if ( ! class_exists( 'Woo_drag_sort' ) ) :

	class Woo_drag_sort {


		public static function init() {
			$theCalc = new self();
		}

		public function __construct() {

			$this->define_constants();
			$this->setup_actions();
		}



		public function define_constants() {

			   define( 'WOODRAGSORT_BASE_URL', trailingslashit( plugins_url( 'woo-drag-sort' ) ) );
			   define( 'WOODRAGSORT_ASSETS_URL', trailingslashit( WOODRAGSORT_BASE_URL . 'assets' ) );
			   define( 'WOODRAGSORT_PATH', plugin_dir_path( __FILE__ ) );
		}

		public static function plugin_activated() {

			if ( ! in_array( 'woocommerce/woocommerce.php', apply_filters( 'active_plugins', get_option( 'active_plugins' ) ) ) ) {
				die( 'WooCommerce plugin must be active' );

			}

		}


		public function show_mini_cart() {
			if ( is_shop() || is_product_category() || is_product_tag() || is_cart() ) :
				require_once 'mini-cart.php';
			endif;
		}

		public function frontend_enqueue_global() {

			if ( is_shop() || is_product_category() || is_product_tag() || is_cart() ) :
				wp_enqueue_style( 'woodragsort_frontend-styles', WOODRAGSORT_ASSETS_URL . 'css/frontend-styles.css', array(), WC_VERSION, false );

				wp_add_inline_style( 'woodragsort_frontend-styles', esc_textarea( get_option( 'woodragsort_additional_css_code' ) ) );

				wp_enqueue_style( 'dashicons' );

				wp_enqueue_script( 'jquery' );
				wp_enqueue_script( 'jquery-ui-sortable' );

				wp_enqueue_script( 'jquery-touch', WOODRAGSORT_ASSETS_URL . 'js/jquery.ui.touch-punch.min.js', array( 'jquery' ), WC_VERSION, true );

				wp_deregister_script( 'wc-cart' );
				wp_enqueue_script( 'wc-cart', WOODRAGSORT_ASSETS_URL . 'js/cart.js', array( 'jquery', 'wc-country-select', 'wc-address-i18n' ), WC_VERSION, true );

				wp_enqueue_script( 'woodragsort_actions', WOODRAGSORT_ASSETS_URL . 'js/actions.js', array( 'jquery', 'wc-cart', 'wc-add-to-cart', 'wc-country-select', 'wc-address-i18n' ), WC_VERSION, true );

				wp_localize_script(
					'woodragsort_actions',
					'woodragsort_ajax_data',
					array(
						'ajaxUrl' => admin_url( 'admin-ajax.php' ),
						'nonce'   => wp_create_nonce( 'ajax_nonce' ),
					)
				);

				endif;

		}


		public function setup_actions() {

			add_action( 'wp_enqueue_scripts', array( $this, 'frontend_enqueue_global' ) );

			add_action( 'woocommerce_cart_loaded_from_session', array( $this, 'reorder_cart_items' ), PHP_INT_MAX );

			add_action( 'wp_ajax_nopriv_reorder_cart_items_callback', array( $this, 'reorder_cart_items_callback' ) );

			add_action( 'wp_ajax_reorder_cart_items_callback', array( $this, 'reorder_cart_items_callback' ) );

			add_action( 'woocommerce_before_main_content', array( $this, 'show_mini_cart' ) );

			add_action( 'admin_menu', array( $this, 'register_admin_page' ), 99999 );

			add_action( 'admin_init', array( $this, 'woodragsort_settings' ) );

		}




		public function register_admin_page() {
			if ( ! is_admin() && ! current_user_can( 'manage_options' ) ) {
				return;
			}

			 $page = add_submenu_page( 'woocommerce', 'Woo Drag Sort', 'Woo Drag Sort', 'manage_options', 'woo-drag-sort', array( $this, 'render_admin_page' ) );

		}

		public function render_admin_page() {

			echo '<h3>Woo Drag Sort </h3>'; ?>
		<form action="options.php" method="post">
				<?php
				 settings_fields( 'woodragsort-settings-group' );
				 do_settings_sections( 'woo-drag-sort' );
				 submit_button();

				?>
		</form>
			<?php
		}



		public function woodragsort_settings() {

			register_setting( 'woodragsort-settings-group', 'woodragsort_additional_css_code' );

			add_settings_section( 'woodragsort-frontend-section', 'Frontend Section', array( $this, 'frontend_section_callback' ), 'woo-drag-sort' );

			add_settings_field( 'woodragdrop-frontend-css-settings', 'CSS Code', array( $this, 'css_code_callback' ), 'woo-drag-sort', 'woodragsort-frontend-section' );

		}




		public function frontend_section_callback() {
			// echo "<h4>Frontend Settings</h4>";
		}

		public function css_code_callback() {
			$css_code = esc_textarea( get_option( 'woodragsort_additional_css_code' ) );
			echo "<textarea rows=10 cols=100; name='woodragsort_additional_css_code' >" . $css_code . '</textarea>';
		}









		public function reorder_cart_items() {
			if ( WC()->cart->get_cart_contents_count() == 0 ) {
				return;
			}

			if ( version_compare( phpversion(), '5.4.0', '>=' ) ) {
				if ( session_status() == PHP_SESSION_NONE ) {
					session_start();
				}
			} else {
				if ( session_id() == '' ) {
					session_start();
				}
			}

			$cart_sort = [];

			$cart_item_keys = array_keys( WC()->cart->cart_contents );

			if ( isset( $_SESSION['cart_item_order'] ) && ! empty( $_SESSION['cart_item_order'] ) ) {

				$item_orders = $_SESSION['cart_item_order'];

				for ( $i = 0;$i < count( $item_orders );$i++ ) {

					$cart_sort[ $cart_item_keys[ $item_orders[ $i ] ] ] = WC()->cart->cart_contents[ $cart_item_keys[ $item_orders[ $i ] ] ];

				}

				// Check if more items added between sorting

				$added_items = array_diff_key( WC()->cart->cart_contents, $cart_sort );

				foreach ( $added_items as $item_key => $item_value ) {
					$cart_sort[ $item_key ] = $item_value;
				}

				WC()->cart->cart_contents = $cart_sort;
				unset( $_SESSION['cart_item_order'] );

				session_write_close();

			}
			return;

		}

		public function reorder_cart_items_callback() {
			check_ajax_referer( 'ajax_nonce', 'security' );

			$reorder_array = $_POST['reorder_items_arr'];

			if ( ! $this->all( $reorder_array, array( $this, 'is_absint' ) ) ) {
				echo json_encode( 'bad input' );
			} else {

				if ( version_compare( phpversion(), '5.4.0', '>=' ) ) {
					if ( session_status() == PHP_SESSION_NONE ) {
						session_start();
					}
				} else {
					if ( session_id() == '' ) {
						session_start();
					}
				}

				$_SESSION['cart_item_order'] = $reorder_array;
				session_write_close();

			}

			wp_die();

		}


		private function all( $array, $fun ) {
			return array_filter( $array, $fun ) === $array;
		}

		private function is_absint( $val ) {
			return ( is_numeric( $val ) && ( (int) $val >= 0 ) );
		}





	}



	add_action( 'plugins_loaded', array( 'Woo_drag_sort', 'init' ), 10 );

	register_activation_hook( __FILE__, array( 'Woo_drag_sort', 'plugin_activated' ) );

endif;
