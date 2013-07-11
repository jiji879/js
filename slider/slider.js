/**
 * 定长元素的滑动插件,只支持webkit浏内核,采用css3转换实现,
 * 排除机器不支持以及没有硬件加速导致的滑动问题.
 *
 * @author 余洪禹
 */

(function($) {
	$.fn.createDetailContainer = function(options) {
		var defaults = {
			total : 0,
			init : 0,
			wing : 1,
			width : 600,
			height : 1000,
			margin : 25,
			sensitive : 2,
			slide_offset : 200,
			speed : 300,
			getNew : function(index) {
				return null;
			},
			afterNew : function(div) {
				return null;
			},
			doCurrent : function(div) {
				return null;
			}
		}
		var caller = $(this);
		var options = $.extend(defaults, options);

		function Slider() {
			var eventTypes = ['touch', 'mouse'];
			var events = {
				start : {
					touch : 'touchstart',
					mouse : 'mousedown',
				},
				move : {
					touch : 'touchmove',
					mouse : 'mousemove',
				},
				end : {
					touch : 'touchend',
					mouse : 'mouseup',
				}
			};

			var self = this;
			var container = $("<div id='slider-container'></div>");
			var curIndex = options.init;
			var curEle = null;

			var eventType = '';
			var moveReady = false;
			var moving = false;
			var startX = 0;
			var startY = 0;
			var left = 0;
			var scroll = false;
			var slide = false;

			init();

			function init() {
				// init container
				container.css({
					'float' : 'left',
					'position' : 'relative',
					'width' : options.total * options.width,
					'-webkit-transform' : 'translateZ(0px)',
				});
				for (var i = 0; i < options.total; i++) {
					container.append("<div style='float:left;height:" + options.height + "px;width:" + options.width + "px'>&nbsp</div>");
				}
				caller.css('overflow', 'hidden');
				container.appendTo(caller);

				var start = -1;
				var end = -1;

				if (options.init < 0 || options.init > options.total - 1) {
					console.log("init index is illegal");
					return;
				} else {
					if (options.init == 0) {
						start = 0;
						end = 2 * options.wing > options.total - 1 ? options.total - 1 : 2 * options.wing;
					} else if (options.init == options.total - 1) {
						end = options.total - 1;
						start = end - 2 * options.wing < 0 ? 0 : end - 2 * options.wing;
					} else {
						start = options.init - options.wing < 0 ? 0 : options.init - options.wing;
						end = options.init + options.wing > options.total - 1 ? options.total - 1 : options.init + options.wing;
					}
				}

				for (var i = start; i <= end; i++) {
					var eleDiv = callbackGetNew(i);
					var jqEle = $(eleDiv);
					if (i == options.init) {
						curEle = jqEle;
					}
					jqEle.css({
						'margin' : '0 ' + options.margin + 'px'
					});
					container.children(':eq(' + i + ')').html(jqEle);
					callbackAfterNew(jqEle);
				}

				left = 0 - curIndex * options.width;
				setLeft(left);
				callbackDoCurrent();

				// add event listener
				eventTypes.forEach(function(type) {
					document.getElementById('slider-container').addEventListener(events.start[type], handleStart);
				});
			}


			Slider.__proto__.handleEvent = function(event) {
				switch (event.type) {
					case events.start.touch:
					case events.start.mouse:
						handleStart(event);
						break;
					case events.move.touch:
					case events.move.mouse:
						handleMove(event);
						break;
					case events.end.touch:
					case events.end.mouse:
						handleEnd(event);
						break;
				}
			};

			function handleStart(event) {
				// two finger touch event
				if (event.changedTouches && event.touches) {
					if (event.touches != 1 && event.changedTouches.length != 1) {
						return;
					}
				}

				if (event.which) {
					if (event.which != 1) {
						return;
					}
				}

				if (moveReady) {
					// resume slider;
					animateLeft(0);
					moveReady = false;
					return;
				}

				// moving end?
				if (moving) {
					event.preventDefault();
					return;
				}

				eventTypes.forEach(function(type) {
					if (event.type.indexOf(type) != -1) {
						eventType = type;
						return;
					}
				});

				startX = getEventParameter(event, 'pageX');
				startY = getEventParameter(event, 'pageY');

				moveReady = true;
				var slider = document.getElementById('slider-container');
				slider.addEventListener(events.move[eventType], handleMove, false);
				document.addEventListener(events.end[eventType], handleEnd, false);
			}

			function handleMove(event) {
				// scroll or slide?
				var pageX = getEventParameter(event, 'pageX');
				var pageY = getEventParameter(event, 'pageY');
				var deltaX = pageX - startX;
				var deltaY = pageY - startY;
				if (scroll) {
					return;
				}

				// leave container?
				var containerLeft = caller.offset().left;
				var containerRight = containerLeft + caller.width();
				if (pageX == containerLeft || pageX == containerRight) {
					if (pageX <= containerLeft) {
						animateLeft(0 - options.width);
					} else {
						animateLeft(options.width);
					}
					moveReady = false;
				} else {
					// move normal,use css left
					if (slide || Math.abs(deltaX) / Math.abs(deltaY) > 1) {
						slide = true;
						event.stopPropagation();
						setLeft(left + deltaX);
					} else if (!slide && Math.abs(deltaY) > options.sensitive) {
						scroll = true;
					} else {
						event.stopPropagation();
					}
				}
			}

			function handleEnd(event) {
				if (!scroll) {
					var pageX = getEventParameter(event, 'pageX');
					var offset = pageX - startX;

					// bigger than sensitive or resume position
					if (Math.abs(offset) > options.slide_offset) {
						// slide!!!
						if (offset < 0) {
							animateLeft(0 - options.width);
						} else {
							animateLeft(options.width);
						}
					} else {
						animateLeft(0);
					}
				} else {
					animateLeft(0);
				}

				// moving = false;
				scroll = false;
				moveReady = false;
			}

			function setLeft(offset) {
				container.css({
					'left' : offset
				});
			}

			function animateLeft(offset) {
				container.css({
					'-webkit-transition' : 'left ' + options.speed / 1000 + 's cubic-bezier(0,0,0.25,1)',
				});

				// remove move and end event
				var slider = document.getElementById('slider-container');
				slider.removeEventListener(events.move[eventType], handleMove);
				document.removeEventListener(events.end[eventType], handleEnd);
				slider.addEventListener('webkitTransitionEnd', moveSlideEnd);

				if ((curIndex == 0 && offset > 0) || (curIndex == options.total - 1 && offset < 0)) {
					left += 0;
				} else {
					left += offset;

					if (offset != 0) {
						moving = true;
					}
				}
				
				container.css({
					'left' : left,
				});
				function moveSlideEnd(event) {
					if ($(event.target).attr('id') == 'slider-container') {
						slider.removeEventListener('webkitTransitionEnd', moveSlideEnd);
						container.css({
							'-webkit-transition' : '',
						});
						afterSlide(offset);
						slide = false;
						moving = false;
					}
				}

			}

			function afterSlide(offset) {
				var newIndex = -1;
				var newElement = null;
				if (offset < 0) {
					if (curIndex > options.wing - 1 && curIndex < options.total - options.wing - 1) {
						newIndex = curIndex + options.wing + 1;
						var n = callbackGetNew(newIndex);

						if (n != null) {
							newElement = $(n);
							newElement.css('margin', '0 ' + options.margin + 'px');
							var last = container.children(':eq(' + (curIndex - options.wing) + ')');
							last.css('height',options.height);
							last.html('&nbsp');
							container.children(':eq(' + (curIndex + options.wing + 1) + ')').html(newElement);
							callbackAfterNew(newElement);
						}
					}
				} else if (offset > 0) {
					if (curIndex < options.total - options.wing && curIndex > options.wing) {
						newIndex = curIndex - options.wing - 1;
						var n = callbackGetNew(newIndex);

						if (n != null) {
							newElement = $(n);
							newElement.css('margin', '0 ' + options.margin + 'px');
							var last = container.children(':eq(' + (curIndex + options.wing) + ')');
							last.css('height',options.height);
							last.html('&nbsp');
							container.children(':eq(' + (curIndex - options.wing - 1) + ')').html(newElement);
							callbackAfterNew(newElement);
						}
					}
				}

				if (offset < 0 && curIndex == options.total - 1) {
					// right most do nothing!
				} else if (offset > 0 && curIndex == 0) {
					// left most do nothing!
				} else if (offset == 0) {
					// not sensitive enough do nothing!
				} else {
					if (offset < 0) {
						curIndex++;
						curEle = curEle.parent().next().children();
					} else if (offset > 0) {
						curIndex--;
						curEle = curEle.parent().prev().children();
					}
					callbackDoCurrent();
				}
			}

			function callbackGetNew(index) {
				return options.getNew.call(self, index);
			}

			function callbackAfterNew(element) {
				setTimeout(_callbackAfterNew, 0, element);
				function _callbackAfterNew(element) {
					options.afterNew.call(self, element);
				}

			}

			function callbackDoCurrent() {
				curEle.parent().css('height','');
				setTimeout(_callbackDoCurrent, 0, curEle);
				function _callbackDoCurrent(ele) {
					options.doCurrent.call(self, ele);
				}

			}

			function getEventParameter(event, param) {
				return event.changedTouches ? event.changedTouches[0][param] : event[param];
			}


			this.__proto__.moveTo = function(toIndex) {
				var container = $("#slider-container");
				var children = container.children();
				for (var i = 0; i < children.length; i++) {
					$(children[i]).css('height',options.height);
					$(children[i]).empty();
				}

				var start = -1;
				var end = -1;

				if (toIndex == 0) {
					start = 0;
					end = 2 * options.wing > options.total - 1 ? options.total - 1 : 2 * options.wing;
					left = 0;
				} else if (toIndex == options.total - 1) {
					end = options.total - 1;
					start = end - 2 * options.wing < 0 ? 0 : end - 2 * options.wing;
					left = 0 - ((options.total - 1) * options.width);
				} else {
					start = toIndex - options.wing < 0 ? 0 : toIndex - options.wing;
					end = toIndex + options.wing > options.total - 1 ? options.total - 1 : toIndex + options.wing;
					left = 0 - toIndex * options.width;
				}

				for (var i = start; i <= end; i++) {
					var eleDiv = callbackGetNew(i);
					var jqEle = $(eleDiv);
					if (i == toIndex) {
						curEle = jqEle;
					}
					jqEle.css({
						'margin' : '0 ' + options.margin + 'px'
					});
					container.children(':eq(' + i + ')').html(jqEle);
					callbackAfterNew(jqEle);
				}

				container.css('-webkit-transition', '');
				curIndex = toIndex;
				setLeft(left);
				callbackDoCurrent();
			}

			return self;
		}

		return new Slider();
	}
})(jQuery);
