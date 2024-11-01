jQuery(document).ready(function($){



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

						if( ( itemClasses.indexOf('product') != -1 ) && ( itemClasses.indexOf( 'product-type-external') === -1 ) ) {

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

			cart_drag_and_drop();


			//show and hide the minicart
			$(document).on('click','.minicart-toggler-container',function(){

				minicart_container = $('.minicart-container');

				if(minicart_container.css('right') == "-350px")

						minicart_container.animate({"right":"0px"});

				else

						minicart_container.animate({"right":"-350px"});
			})
})