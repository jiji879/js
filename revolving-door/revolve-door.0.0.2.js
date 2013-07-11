(function ($){
	$.fn.extend({
		RevolveDoor:function(elements,options){
			var caller = $(this);

			var defaults = {
				width:"300px",
				translate_z:"400px",
				perspective:"800px",
				perspective_origin_x:"50%",
				perspective_origin_y:"50%",
				rotate_speed:"1",
				enable_lr_event:true,
				enable_click_element:true
			}

			var options = $.extend(defaults,options);

			var rTotal = 0;
			var rotateFlagArr = new Array(elements.length);

			init();

			createContainer();

			createRevolveDoors();

			addEventListener();

			function init(){
				caller.css({"-webkit-perspective":options.perspective,"-webkit-perspective-origin":options.perspective_origin_x+" "+options.perspective_origin_y});
				for(var i = 0;i < elements.length;i++){
					rotateFlagArr[i] = true;
				}
			}

			function createContainer(){
				container = $("<div id='rd_container'></div>");
				container.css({"width":options.width,"height":"100","margin":"0 auto"});
				container.appendTo(caller);
			}

			function createRevolveDoors(){
				var elementLength = elements.length;
				var theta = 360 / elementLength;

				for (var i = 0; i < elementLength; i++) {
					var jqItem = elements[i];
					var eachZ = calZindex(i*theta);
					jqItem.css({"width":options.width,"position":"absolute","-webkit-transform":"rotateY("+ (i * theta) +"deg) translateZ("+options.translate_z+")",
						"-webkit-transition":"-webkit-transform "+options.rotate_speed+"s","z-index":eachZ});

					jqItem.appendTo(container);
				}
			}

			function calZindex(deg){
				return (Math.abs(deg - 180) / 360) * elements.length;
			}

			function addEventListener(){
				var platform = navigator.platform;

				addPcLrEventListener();
				addClickEventListener();

				container.on("webkitTransitionEnd",function(e){
					var target = $(e.target);
					if($(target.parent()).attr("id") == "rd_container"){
						var index = target.index();
						rotateFlagArr[index] = true;
					}
				});
			}

			function addPcLrEventListener(){
				if(options.enable_lr_event){
					$(document).on("keydown",function(e){
						if(isRotateReady()){
							var rDeg = 0;
							var needR = true;
							var theta = 360 / elements.length;
							switch (e.keyCode){
								case 37:
									rDeg -= theta;
									break;
								case 39:
									rDeg += theta;
									break;
								default:
									needR = false;
									break;
							}

							if(needR){
								rotateElements(rDeg);
							}
						}
					});
				}
			}

			function addClickEventListener(){
				container.children().on("click",function(e){
					if(isRotateReady()){
						if(!options.enable_click_element){
							return;
						}

						var matrix = $(this).css("-webkit-transform");
						var ts = matrix.substring(matrix.indexOf("(") + 1,matrix.indexOf(")")).split(",");
						var cosT = ts[0];
						var sinT = ts[2];
						var arcCos = Math.floor((Math.acos(cosT) * 180) / Math.PI);
						arcCos = arcCos - arcCos % (360 / elements.length);
						var rDeg = 0;
						if(sinT > 0){
							rDeg += arcCos;
						} else {
							rDeg -= arcCos;
						}

						rotateElements(rDeg);
					}
				});
			}

			function rotateElements(rDeg){
				rTotal += rDeg;
				var theta = 360 / elements.length;
				for(var i = 0; i < elements.length; i++){
					var eachDeg = (i * theta) + rTotal;
					var eachZ = calZindex(Math.abs(eachDeg % 360));
					var element = elements[i];
					rotateFlagArr[i] = false;
					element.css({"z-index":eachZ,"-webkit-transform":"rotateY("+ eachDeg +"deg) translateZ("+options.translate_z+")"});
				}
			}
			

			function isRotateReady(){
				var rotateReady = true;
				for(index in rotateFlagArr){
					if(!rotateReady){
						break;
					} else {
						rotateReady = rotateReady && rotateFlagArr[index];
					}
				}
				return rotateReady;
			}
		}
	});
})(jQuery);