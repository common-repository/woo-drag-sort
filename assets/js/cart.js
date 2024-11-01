/* global wc_cart_params */
jQuery( function( $ ) {


	function cart_drag_and_drop(){

		//add ui-sortable to minicart-container, cart table , products ul
		$('form.woocommerce-cart-form tbody, ul.cart_list, ul.products').addClass('ui-sortable');

		// handle icon for dragging
		handle_icon = '<i class="handle move-btn dashicons dashicons-move" ></i>';

		//adding the handle to cart table items
		$('td.product-remove').prepend(handle_icon);


		//adding the handle to mini cart items
		$('li.mini_cart_item a.remove').before(handle_icon);


		var startPos = 0;

		//check whether minicart or cart page
		if($('form.woocommerce-cart-form').length)
				var item_nums = $('form.woocommerce-cart-form tbody tr').length-1;
		else
				var item_nums = $('ul.cart_list>li').length;


		var items_order = [];


		for(var i=0;i<item_nums;i++){
			items_order[i] = i;
		}


		//sortable function for cart and minicart sorting
		$('form.woocommerce-cart-form tbody, ul.cart_list').sortable({

			handle 		: ".handle",
			cursor 		: "move",
			opacity 	: 0.7,
			scroll 		: true,
			tolerance 	: "pointer",
			containment : "parent",

			start:function(event,ui){
				itemClasses = ui.item.attr('class').split(' ');
				if(itemClasses.indexOf('product') == -1){
						prevPos   = ui.item.index();
						startPos  = items_order[prevPos];
				}
			},

			update: function(event,ui){

				itemClasses = ui.item.attr('class').split(' ');

				if(itemClasses.indexOf('product') == -1){
					items_order.splice(prevPos,1);
					var newPos = ui.item.index();

					items_order.splice(newPos,0,startPos);

					var changeOrder = null;
						block( $( 'div.minicart-container' ) );
						block( $( 'div.cart_totals' ) );
						block( $('form.woocommerce-cart-form') );

					changeOrder = $.ajax({
						url:woodragsort_ajax_data.ajaxUrl,
						method:'post',
						data:{
							security:woodragsort_ajax_data.nonce,
							reorder_items_arr:items_order,
							action:'reorder_cart_items_callback'
						},
						beforeSend:function(){
							if(changeOrder != null)
								changeOrder.abort();
						},
						complete:function(){
									unblock( $( 'div.minicart-container' ) );
									unblock( $( 'div.cart_totals' ) );
									unblock( $('form.woocommerce-cart-form') );

						}

						});
				}

			}


		});   ///Main sortable function end


		//sortable function for dropping products in minicart
		isOut = false;
		$('.drop_product_mini_cart_container').sortable({

			connectWith  : "ul.products",
			tolerance    : "pointer",


			over:function(event,ui){

				itemClasses = ui.item.attr('class').split(' ');

				if(itemClasses.indexOf('product') != -1){

					$(this).sortable({connectWith:"ul.products"});

					$('.minicart-container .drop_product_mini_cart_container').animate({'height':'150px'});

						isOut  = false;
				}

			},
			out:function(event,ui){

				itemClasses = ui.item.attr('class').split(' ');

				if(itemClasses.indexOf('product') != -1){

					$('.minicart-container .drop_product_mini_cart_container').animate({'height':'50px'});


						isOut  = true;


				}


			},
			receive:function(event,ui){

				if(isOut)

					return;

				itemClasses = ui.item.attr('class').split(' ');

				if(itemClasses.indexOf('product') != -1){

					block( $( 'div.minicart-container' ) );

					productDetails = ui.item.find('.add_to_cart_button').data();

					if(productDetails == undefined)

						return;

					$(this).sortable('cancel');

					$('ul.products').sortable('cancel');

					data = productDetails;



					$.post( wc_add_to_cart_params.wc_ajax_url.toString().replace( '%%endpoint%%', 'add_to_cart' ), data, function( response ) {

							if ( ! response ) {
								return;
							}

							if ( response.error && response.product_url ) {
								window.location = response.product_url;
								return;
							}

							returnHtml = $($.parseHTML(response.fragments[Object.keys(response.fragments)[0]]));

							newMiniCartHtml = returnHtml.find('ul.cart_list');


							newMiniCartHtml.addClass('ui-sortable');
							newMiniCartHtml.find('li.mini_cart_item a.remove').before(handle_icon);

							$('.minicart-container ul.cart_list').html(newMiniCartHtml.children());

							$('.minicart-container .total').replaceWith(returnHtml.find('.total'));

								startPos = 0;
								item_nums = $('ul.cart_list>li').length;
								items_order = [];

							for(var i=0;i<item_nums;i++){
								items_order[i] = i;
							}


							unblock( $( 'div.minicart-container' ) );


							// Redirect to cart option
							if ( wc_add_to_cart_params.cart_redirect_after_add === 'yes' ) {

								window.location = wc_add_to_cart_params.cart_url;
								return;

							} else {

								// Trigger event so themes can refresh other areas
								$( document.body ).trigger( 'added_to_cart', [ response.fragments, response.cart_hash] );

							}
					});

				}
			}



		})





			//Add to mini cart product using drag and drop
		product_width 		  =  '';
		product_height 		  =  '';
		product_overflow 	  =  '';
		product_image_height  =  '';
		product_ul_width 	  =  $('ul.products').css('width');

		$('ul.products').sortable({

			connectWith  :  ".drop_product_mini_cart_container",
			zIndex       :  99999,
			cursor       :  "move",
			delay        :  150,
			opacity		 :  0.4,
			cursorAt	 : {left:75,top:75},
			tolerance 	 : "pointer",


			start: function(event,ui){
				product_ul_width  = $('ul.products').css('width');

				$('ul.products').css({'width':'0px','overflow':'hidden'});

				var dragged_product = ui.item; //li.product

				var dragged_product_id = ui.item.find('input[name="product_id"]').val();

				$('.minicart-container').css({'z-index':1000});

				product_li = ui.item;

				product_width 			= product_li.css('width');
				product_height 			= product_li.css('height');
				product_overflow 		= product_li.css('overflow');
				product_image_height 	= product_li.find('img.attachment-shop_catalog').css('height');

				product_li.css({'width':'150px','height':'150px','overflow':'hidden'});

				product_li.find('img.attachment-shop_catalog').css({'height':'100%'});


			},
			stop:function(event, ui){
				$(this).sortable('cancel');

				var dropped_product = ui.item;

				ui.item.css({'width':product_width,'height':product_height,'overflow': product_overflow});

				ui.item.find('img.attachment-shop_catalog').css({'height':product_image_height});

				$('ul.products').css({'width':product_ul_width});
			}

		});



	}





	// wc_cart_params is required to continue, ensure the object exists
	if ( typeof wc_cart_params === 'undefined' ) {
		return false;
	}

	// Utility functions for the file.

	/**
	 * Gets a url for a given AJAX endpoint.
	 *
	 * @param {String} endpoint The AJAX Endpoint
	 * @return {String} The URL to use for the request
	 */
	var get_url = function( endpoint ) {
		return wc_cart_params.wc_ajax_url.toString().replace(
			'%%endpoint%%',
			endpoint
		);
	};

	/**
	 * Check if a node is blocked for processing.
	 *
	 * @param {JQuery Object} $node
	 * @return {bool} True if the DOM Element is UI Blocked, false if not.
	 */
	var is_blocked = function( $node ) {
		return $node.is( '.processing' ) || $node.parents( '.processing' ).length;
	};

	/**
	 * Block a node visually for processing.
	 *
	 * @param {JQuery Object} $node
	 */
	var block = function( $node ) {
		if ( ! is_blocked( $node ) ) {
			$node.addClass( 'processing' ).block( {
				message: null,
				overlayCSS: {
					background: '#fff',
					opacity: 0.6
				}
			} );
		}
	};

	/**
	 * Unblock a node after processing is complete.
	 *
	 * @param {JQuery Object} $node
	 */
	var unblock = function( $node ) {
		$node.removeClass( 'processing' ).unblock();
	};

	/**
	 * Update the .woocommerce div with a string of html.
	 *
	 * @param {String} html_str The HTML string with which to replace the div.
	 * @param {bool} preserve_notices Should notices be kept? False by default.
	 */
	var update_wc_div = function( html_str, preserve_notices ) {
		var $html       = $.parseHTML( html_str );
		var $new_form   = $( '.woocommerce-cart-form', $html );
		var $new_totals = $( '.cart_totals', $html );
		var $notices    = $( '.woocommerce-error, .woocommerce-message, .woocommerce-info', $html );

		// No form, cannot do this.
		if ( $( '.woocommerce-cart-form' ).length === 0 ) {
			window.location.href = window.location.href;
			return;
		}

		// Remove errors
		if ( ! preserve_notices ) {
			$( '.woocommerce-error, .woocommerce-message, .woocommerce-info' ).remove();
		}

		if ( $new_form.length === 0 ) {
			// If the checkout is also displayed on this page, trigger reload instead.
			if ( $( '.woocommerce-checkout' ).length ) {
				window.location.href = window.location.href;
				return;
			}

			// No items to display now! Replace all cart content.
			var $cart_html = $( '.cart-empty', $html ).closest( '.woocommerce' );
			$( '.woocommerce-cart-form__contents' ).closest( '.woocommerce' ).replaceWith( $cart_html );

			// Display errors
			if ( $notices.length > 0 ) {
				show_notice( $notices, $( '.cart-empty' ).closest( '.woocommerce' ) );
			}
		} else {
			// If the checkout is also displayed on this page, trigger update event.
			if ( $( '.woocommerce-checkout' ).length ) {
				$( document.body ).trigger( 'update_checkout' );
			}

			$( '.woocommerce-cart-form' ).replaceWith( $new_form );
			$( '.woocommerce-cart-form' ).find( 'input[name="update_cart"]' ).prop( 'disabled', true );

			if ( $notices.length > 0 ) {
				show_notice( $notices );
			}

			update_cart_totals_div( $new_totals );
		}

		$( document.body ).trigger( 'updated_wc_div' );
		cart_drag_and_drop();
	};

	/**
	 * Update the .cart_totals div with a string of html.
	 *
	 * @param {String} html_str The HTML string with which to replace the div.
	 */
	var update_cart_totals_div = function( html_str ) {
		$( '.cart_totals' ).replaceWith( html_str );
		$( document.body ).trigger( 'updated_cart_totals' );
	};

	/**
	 * Clear previous notices and shows new one above form.
	 *
	 * @param {Object} The Notice HTML Element in string or object form.
	 */
	var show_notice = function( html_element, $target ) {
		if ( ! $target ) {
			$target = $( '.woocommerce-cart-form' );
		}
		$target.before( html_element );
	};


	/**
	 * Object to handle AJAX calls for cart shipping changes.
	 */
	var cart_shipping = {

		/**
		 * Initialize event handlers and UI state.
		 */
		init: function( cart ) {
			this.cart                       = cart;
			this.toggle_shipping            = this.toggle_shipping.bind( this );
			this.shipping_method_selected   = this.shipping_method_selected.bind( this );
			this.shipping_calculator_submit = this.shipping_calculator_submit.bind( this );

			$( document ).on(
				'click',
				'.shipping-calculator-button',
				this.toggle_shipping
			);
			$( document ).on(
				'change',
				'select.shipping_method, input[name^=shipping_method]',
				this.shipping_method_selected
			);
			$( document ).on(
				'submit',
				'form.woocommerce-shipping-calculator',
				this.shipping_calculator_submit
			);

			$( '.shipping-calculator-form' ).hide();
		},

		/**
		 * Toggle Shipping Calculator panel
		 */
		toggle_shipping: function() {
			$( '.shipping-calculator-form' ).slideToggle( 'slow' );
			$( document.body ).trigger( 'country_to_state_changed' ); // Trigger select2 to load.
			return false;
		},

		/**
		 * Handles when a shipping method is selected.
		 *
		 * @param {Object} evt The JQuery event.
		 */
		shipping_method_selected: function( evt ) {
			var target = evt.currentTarget;

			var shipping_methods = {};

			$( 'select.shipping_method, input[name^=shipping_method][type=radio]:checked, input[name^=shipping_method][type=hidden]' ).each( function() {
				shipping_methods[ $( target ).data( 'index' ) ] = $( target ).val();
			} );

			block( $( 'div.cart_totals' ) );

			var data = {
				security: wc_cart_params.update_shipping_method_nonce,
				shipping_method: shipping_methods
			};

			$.ajax( {
				type:     'post',
				url:      get_url( 'update_shipping_method' ),
				data:     data,
				dataType: 'html',
				success:  function( response ) {
					update_cart_totals_div( response );
				},
				complete: function() {
					unblock( $( 'div.cart_totals' ) );
					$( document.body ).trigger( 'updated_shipping_method' );
				}
			} );
		},

		/**
		 * Handles a shipping calculator form submit.
		 *
		 * @param {Object} evt The JQuery event.
		 */
		shipping_calculator_submit: function( evt ) {
			evt.preventDefault();

			var $form = $( evt.currentTarget );

			block( $( 'div.cart_totals' ) );
			block( $form );

			// Provide the submit button value because wc-form-handler expects it.
			$( '<input />' ).attr( 'type', 'hidden' )
							.attr( 'name', 'calc_shipping' )
							.attr( 'value', 'x' )
							.appendTo( $form );

			// Make call to actual form post URL.
			$.ajax( {
				type:     $form.attr( 'method' ),
				url:      $form.attr( 'action' ),
				data:     $form.serialize(),
				dataType: 'html',
				success:  function( response ) {
					update_wc_div( response );
				},
				complete: function() {
					unblock( $form );
					unblock( $( 'div.cart_totals' ) );
				}
			} );
		}
	};

	/**
	 * Object to handle cart UI.
	 */
	var cart = {
		/**
		 * Initialize cart UI events.
		 */
		init: function() {
			this.update_cart_totals    = this.update_cart_totals.bind( this );
			this.input_keypress        = this.input_keypress.bind( this );
			this.cart_submit           = this.cart_submit.bind( this );
			this.submit_click          = this.submit_click.bind( this );
			this.apply_coupon          = this.apply_coupon.bind( this );
			this.remove_coupon_clicked = this.remove_coupon_clicked.bind( this );
			this.quantity_update       = this.quantity_update.bind( this );
			this.item_remove_clicked   = this.item_remove_clicked.bind( this );
			this.item_restore_clicked  = this.item_restore_clicked.bind( this );
			this.update_cart           = this.update_cart.bind( this );

			$( document ).on(
				'wc_update_cart',
				function() { cart.update_cart.apply( cart, [].slice.call( arguments, 1 ) ); } );
			$( document ).on(
				'click',
				'.woocommerce-cart-form input[type=submit]',
				this.submit_click );
			$( document ).on(
				'keypress',
				'.woocommerce-cart-form input[type=number]',
				this.input_keypress );
			$( document ).on(
				'submit',
				'.woocommerce-cart-form',
				this.cart_submit );
			$( document ).on(
				'click',
				'a.woocommerce-remove-coupon',
				this.remove_coupon_clicked );
			$( document ).on(
				'click',
				'.woocommerce-cart-form .product-remove > a',
				this.item_remove_clicked );
			$( document ).on(
				'click',
				'.woocommerce-cart .restore-item',
				this.item_restore_clicked );
			$( document ).on(
				'change input',
				'.woocommerce-cart-form .cart_item :input',
				this.input_changed );

			$( '.woocommerce-cart-form input[name="update_cart"]' ).prop( 'disabled', true );
		},

		/**
		 * After an input is changed, enable the update cart button.
		 */
		input_changed: function() {
			$( '.woocommerce-cart-form input[name="update_cart"]' ).prop( 'disabled', false );
		},

		/**
		 * Update entire cart via ajax.
		 */
		update_cart: function( preserve_notices ) {
			var $form = $( '.woocommerce-cart-form' );

			block( $form );
			block( $( 'div.cart_totals' ) );

			// Make call to actual form post URL.
			$.ajax( {
				type:     $form.attr( 'method' ),
				url:      $form.attr( 'action' ),
				data:     $form.serialize(),
				dataType: 'html',
				success:  function( response ) {
					update_wc_div( response, preserve_notices );
				},
				complete: function() {
					unblock( $form );
					unblock( $( 'div.cart_totals' ) );
				}
			} );
		},

		/**
		 * Update the cart after something has changed.
		 */
		update_cart_totals: function() {
			block( $( 'div.cart_totals' ) );

			$.ajax( {
				url:      get_url( 'get_cart_totals' ),
				dataType: 'html',
				success:  function( response ) {
					update_cart_totals_div( response );
				},
				complete: function() {
					unblock( $( 'div.cart_totals' ) );
				}
			} );
		},

		/**
		 * Handle the <ENTER> key for quantity fields.
		 *
		 * @param {Object} evt The JQuery event
		 *
		 * For IE, if you hit enter on a quantity field, it makes the
		 * document.activeElement the first submit button it finds.
		 * For us, that is the Apply Coupon button. This is required
		 * to catch the event before that happens.
		 */
		input_keypress: function( evt ) {

			// Catch the enter key and don't let it submit the form.
			if ( 13 === evt.keyCode ) {
				evt.preventDefault();
				this.cart_submit( evt );
			}
		},

		/**
		 * Handle cart form submit and route to correct logic.
		 *
		 * @param {Object} evt The JQuery event
		 */
		cart_submit: function( evt ) {
			var $submit = $( document.activeElement );
			var $clicked = $( 'input[type=submit][clicked=true]' );
			var $form = $( evt.currentTarget );

			// For submit events, currentTarget is form.
			// For keypress events, currentTarget is input.
			if ( ! $form.is( 'form' ) ) {
				$form = $( evt.currentTarget ).parents( 'form' );
			}

			if ( 0 === $form.find( '.woocommerce-cart-form__contents' ).length ) {
				return;
			}

			if ( is_blocked( $form ) ) {
				return false;
			}

			if ( $clicked.is( 'input[name="update_cart"]' ) || $submit.is( 'input.qty' ) ) {
				evt.preventDefault();
				this.quantity_update( $form );

			} else if ( $clicked.is( 'input[name="apply_coupon"]' ) || $submit.is( '#coupon_code' ) ) {
				evt.preventDefault();
				this.apply_coupon( $form );
			}
		},

		/**
		 * Special handling to identify which submit button was clicked.
		 *
		 * @param {Object} evt The JQuery event
		 */
		submit_click: function( evt ) {
			$( 'input[type=submit]', $( evt.target ).parents( 'form' ) ).removeAttr( 'clicked' );
			$( evt.target ).attr( 'clicked', 'true' );
		},

		/**
		 * Apply Coupon code
		 *
		 * @param {JQuery Object} $form The cart form.
		 */
		apply_coupon: function( $form ) {
			block( $form );

			var cart = this;
			var $text_field = $( '#coupon_code' );
			var coupon_code = $text_field.val();

			var data = {
				security: wc_cart_params.apply_coupon_nonce,
				coupon_code: coupon_code
			};

			$.ajax( {
				type:     'POST',
				url:      get_url( 'apply_coupon' ),
				data:     data,
				dataType: 'html',
				success: function( response ) {
					$( '.woocommerce-error, .woocommerce-message, .woocommerce-info' ).remove();
					show_notice( response );
					$( document.body ).trigger( 'applied_coupon', [ coupon_code ] );
				},
				complete: function() {
					unblock( $form );
					$text_field.val( '' );
					cart.update_cart( true );
				}
			} );
		},

		/**
		 * Handle when a remove coupon link is clicked.
		 *
		 * @param {Object} evt The JQuery event
		 */
		remove_coupon_clicked: function( evt ) {
			evt.preventDefault();

			var cart     = this;
			var $wrapper = $( evt.currentTarget ).closest( '.cart_totals' );
			var coupon   = $( evt.currentTarget ).attr( 'data-coupon' );

			block( $wrapper );

			var data = {
				security: wc_cart_params.remove_coupon_nonce,
				coupon: coupon
			};

			$.ajax( {
				type:    'POST',
				url:      get_url( 'remove_coupon' ),
				data:     data,
				dataType: 'html',
				success: function( response ) {
					$( '.woocommerce-error, .woocommerce-message, .woocommerce-info' ).remove();
					show_notice( response );
					$( document.body ).trigger( 'removed_coupon', [ coupon ] );
					unblock( $wrapper );
				},
				complete: function() {
					cart.update_cart( true );
				}
			} );
		},

		/**
		 * Handle a cart Quantity Update
		 *
		 * @param {JQuery Object} $form The cart form.
		 */
		quantity_update: function( $form ) {
			block( $form );
			block( $( 'div.cart_totals' ) );

			// Provide the submit button value because wc-form-handler expects it.
			$( '<input />' ).attr( 'type', 'hidden' )
							.attr( 'name', 'update_cart' )
							.attr( 'value', 'Update Cart' )
							.appendTo( $form );

			// Make call to actual form post URL.
			$.ajax( {
				type:     $form.attr( 'method' ),
				url:      $form.attr( 'action' ),
				data:     $form.serialize(),
				dataType: 'html',
				success:  function( response ) {
					update_wc_div( response );
				},
				complete: function() {
					unblock( $form );
					unblock( $( 'div.cart_totals' ) );
				}
			} );
		},

		/**
		 * Handle when a remove item link is clicked.
		 *
		 * @param {Object} evt The JQuery event
		 */
		item_remove_clicked: function( evt ) {
			evt.preventDefault();

			var $a = $( evt.currentTarget );
			var $form = $a.parents( 'form' );

			block( $form );
			block( $( 'div.cart_totals' ) );

			$.ajax( {
				type:     'GET',
				url:      $a.attr( 'href' ),
				dataType: 'html',
				success:  function( response ) {
					update_wc_div( response );
				},
				complete: function() {
					unblock( $form );
					unblock( $( 'div.cart_totals' ) );
				}
			} );
		},

		/**
		 * Handle when a restore item link is clicked.
		 *
		 * @param {Object} evt The JQuery event
		 */
		item_restore_clicked: function( evt ) {
			evt.preventDefault();

			var $a = $( evt.currentTarget );
			var $form = $( 'form.woocommerce-cart-form' );

			block( $form );
			block( $( 'div.cart_totals' ) );

			$.ajax( {
				type:     'GET',
				url:      $a.attr( 'href' ),
				dataType: 'html',
				success:  function( response ) {
					update_wc_div( response );
				},
				complete: function() {
					unblock( $form );
					unblock( $( 'div.cart_totals' ) );
				}
			} );
		}
	};

	cart_shipping.init( cart );
	cart.init();
} );
