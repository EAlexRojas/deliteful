/** @module deliteful/Accordion */
define(["dcl/dcl",
	"decor/sniff",
	"requirejs-dplugins/Promise!",
	"delite/register",
	"dpointer/events",
	"requirejs-dplugins/jquery!attributes/classes",
	"delite/DisplayContainer",
	"./ToggleButton",
	"delite/theme!./Accordion/themes/{{theme}}/Accordion.css"
], function (dcl, has, Promise, register, events, $, DisplayContainer, ToggleButton) {

	function setVisibility(node, val) {
		if (val) {
			node.style.display = "";
		} else {
			node.style.display = "none";
		}
	}

	var animationEndEvent = (function () {
		var animationEndEvents = {
			"animation": "animationend", // > IE10, FF
			"-webkit-animation": "webkitAnimationEnd",   // > chrome 1.0 , > Android 2.1 , > Safari 3.2
			"-ms-animation": "MSAnimationEnd" // IE 10
		};
		// NOTE: returns null if event is not supported
		var fakeElement = document.createElement("fakeElement");
		for (var event in animationEndEvents) {
			if (fakeElement.style[event] !== undefined) {
				return animationEndEvents[event];
			}
		}
		return null;
	})();

	function listenAnimationEndEvent(element, callback) {
		if (animationEndEvent) {
			return new Promise(function (resolve) {
				var handler = element.on(animationEndEvent, function () {
					callback(element);
					handler.remove();
					resolve();
				});
			});
		}
	}

	/**
	 * A layout container that display a vertically stacked list of Panels whose titles are all visible, but only one
	 * or at least one panel's content is visible at a time (depending on the singleOpen property value).
	 *
	 * Once the panels are in an accordion, they become collapsible Panels by replacing their headers by ToggleButtons.
	 *
	 * When a panel is open, it fills all the available space with its content.
	 *
	 * @example:
	 * <d-accordion id="accordion" selectedChildId="panel1">
	 *     <d-panel id="panel1">...</d-panel>
	 *     <d-panel id="panel2">...</d-panel>
	 *     <d-panel id="panel3">...</d-panel>
	 * </d-accordion>
	 * @class module:deliteful/Accordion
	 * @augments module:delite/DisplayContainer
	 */
	var Accordion = dcl(DisplayContainer, /** @lends module:deliteful/Accordion# */ {

		/**
		 * The name of the CSS class of this widget.
		 * @member {string}
		 * @default "d-accordion"
		 */
		baseClass: "d-accordion",

		/**
		 * The id of the panel to be open at initialization.
		 * If not specified, the default open panel is the first one.
		 * @member {string}
		 * @default ""
		 */
		selectedChildId : "",

		/**
		 * If true, only one panel is open at a time.
		 * If false, several panels can be open at a time, but there's always at least one open.
		 * @member {boolean}
		 * @default true
		 */
		singleOpen: true,

		/**
		 * If true, animation is used when a panel is opened or closed.
		 * @member {boolean}
		 * @default true
		 */
		animate: true,

		/**
		 * The default CSS class to apply to DOMNode in children headers to make them display an icon when they are
		 * open. If a child panel has its own iconClass specified, that value is used on that panel.
		 * @member {string}
		 * @default ""
		 */
		openIconClass : "",

		/**
		 * The default CSS class to apply to DOMNode in children headers to make them display an icon when they are
		 * closed. If a child panel has its own closedIconClass specified, that value is used on that panel.
		 * @member {string}
		 * @default ""
		 */
		closedIconClass : "",

		_panelList: null,

		_numOpenPanels: 0,

		_changeHandler: function (event) {
			var panel = event.target.parentNode;
			//Case when the event is fired by the label or the icon
			if (panel.nodeName.toLowerCase() !== "d-panel") {
				panel = panel.parentNode;
			}
			if (this.singleOpen) {
				this.show(panel);
			} else {
				if (panel.open) {
					this.hide(panel);
				} else {
					this.show(panel);
				}
			}
		},

		_setupUpgradedChild: function (panel) {
			//TODO: To change when https://github.com/ibm-js/delite/issues/414 be solved
			var toggle = new ToggleButton({
				label: panel.label,
				iconClass: panel.closedIconClass || this.closedIconClass,
				checkedIconClass: panel.iconClass || this.openIconClass
			});
			toggle.placeAt(panel.headerNode, "replace");
			// React to programmatic changes on the panel to update the button
			panel.observe(function (oldValues) {
				if ("label" in oldValues) {
					this.headerNode.label = this.label;
				}
				if ("iconClass" in oldValues) {
					this.headerNode.checkedIconClass = this.iconClass;
				}
				if ("closedIconClass" in oldValues) {
					this.headerNode.iconClass = this.closedIconClass;
				}
			}.bind(panel));
			toggle.on("click", this._changeHandler.bind(this));
			panel.headerNode = toggle;
			setVisibility(panel.containerNode, false);
			panel.open = false;
			return panel;
		},

		_numNonUpgradedChildren: 0,

		_setupNonUpgradedChild: function (panel) {
			panel.accordion = this;
			this._numNonUpgradedChildren++;
			panel.addEventListener("customelement-attached", this._attachedlistener = function () {
				this.removeEventListener("customelement-attached", this._attachedlistener);
				this.accordion._panelList.push(this.accordion._setupUpgradedChild(this));
				this.accordion._numNonUpgradedChildren--;
			}.bind(panel));
		},

		attachedCallback: function () {
			this._panelList = [];
			// Declarative case (panels specified declaratively inside the declarative Accordion)
			var panels = this.querySelectorAll("d-panel");
			if (panels) {
				for (var i = 0, l = panels.length; i < l; i++) {
					if (!panels[i].attached) {
						this._setupNonUpgradedChild(panels[i]);
					} else {
						this._panelList.push(this._setupUpgradedChild(panels[i]));
					}
				}
			}
		},

		_showOpenPanel: function () {
			//The default open panel is the first one
			if (!this._selectedChild && this._panelList.length > 0) {
				this._selectedChild = this._panelList[0];
			}
			//Show selectedChild if exists
			if (this._selectedChild && this._selectedChild.attached) {
				this.show(this._selectedChild);
			}
		},

		/* jshint maxcomplexity: 13 */
		refreshRendering: function (props) {
			if ("selectedChildId" in props) {
				var childNode = this.ownerDocument.getElementById(this.selectedChildId);
				if (childNode) {
					if (childNode.attached) {
						if (childNode !== this._selectedChild) { //To avoid calling show() method twice
							if (!this._selectedChild) { //If selectedChild is not initialized, then initialize it
								this._selectedChild = childNode;
							}
							this.show(childNode);
						}
					} else {
						this._selectedChild = childNode;
					}
				}
			}
			if ("attached" in props || "_numNonUpgradedChildren" in  props) {
				if (this._numNonUpgradedChildren === 0) {
					this._showOpenPanel();
				}
			}
			if ("openIconClass" in props) {
				this.getChildren().forEach(function (panel) {
					if (panel.attached && !panel.iconClass) {
						panel.headerNode.checkedIconClass = this.openIconClass;
					}
				}.bind(this));
			}
			if ("closedIconClass" in props) {
				this.getChildren().forEach(function (panel) {
					if (panel.attached && !panel.closedIconClass) {
						panel.headerNode.iconClass = this.closedIconClass;
					}
				}.bind(this));
			}
			if ("singleOpen" in props) {
				if (this.singleOpen) {
					this._showOpenPanel();
					this._panelList.forEach(function (panel) {
						if (panel.open && panel !== this._selectedChild) {
							this.hide(panel);
						}
					}.bind(this));
				}
			}
		},
		/* jshint maxcomplexity: 10 */

		_supportAnimation: function () {
			//Transition events are broken if the widget is not visible
			var parent = this;
			while (parent && parent.style.display !== "none" && parent !== this.ownerDocument.documentElement) {
				parent = parent.parentNode;
			}
			var visible =  parent === this.ownerDocument.documentElement;

			//Flexbox animation is not supported on IE
			//TODO: Create a feature test for flexbox animation
			return visible && (!has("ie"));
		},

		_doTransition: function (panel, params) {
			var promise;
			if (params.hide) {
				if (this.animate && this._supportAnimation()) {
					//To avoid hiding the panel title bar on animation
					panel.style.minHeight = window.getComputedStyle(panel.headerNode).getPropertyValue("height");
					$(panel).addClass("d-accordion-closeAnimation").removeClass("d-accordion-open-panel");
					$(panel.containerNode).removeClass("d-panel-content-open");
					panel.containerNode.style.overflow = "hidden"; //To avoid scrollBar on animation
					promise = listenAnimationEndEvent(panel, function (element) {
						setVisibility(element.containerNode, element.open);
						$(element).removeClass("d-accordion-closeAnimation");
						element.containerNode.style.overflow = "auto";
						element.style.minHeight = "";
					});
				} else {
					$(panel).removeClass("d-accordion-open-panel");
					$(panel.containerNode).removeClass("d-panel-content-open");
					setVisibility(panel.containerNode, false);
				}
			} else {
				if (this.animate && this._supportAnimation()) {
					//To avoid hiding the panel title bar on animation
					panel.style.minHeight = window.getComputedStyle(panel.headerNode).getPropertyValue("height");
					$(panel).addClass("d-accordion-openAnimation");
					$(panel.containerNode).addClass("d-panel-content-open");
					setVisibility(panel.containerNode, true);
					panel.containerNode.style.overflow = "hidden"; //To avoid scrollBar on animation
					promise = listenAnimationEndEvent(panel, function (element) {
						$(element).addClass(function () {
							return element.open ? "d-accordion-open-panel" : "";
						}).removeClass("d-accordion-openAnimation");
						element.containerNode.style.overflow = "auto";
						element.style.minHeight = "";
					});
				} else {
					$(panel).addClass("d-accordion-open-panel");
					$(panel.containerNode).addClass("d-panel-content-open");
					setVisibility(panel.containerNode, true);
				}
			}
			return Promise.resolve(promise);
		},

		changeDisplay: function (widget, params) {
			var valid = true, promises = [];
			if (params.hide) {
				if (widget.open) {
					if (this._numOpenPanels > 1) {
						this._numOpenPanels--;
						widget.open = false;
						widget.headerNode.checked = false;
					} else {
						widget.headerNode.checked = true;
						valid = false;
					}
				} else {
					widget.headerNode.checked = false;
					valid = false;
				}
			} else {
				if (!widget.open) {
					this._numOpenPanels++;
					if (this.singleOpen) {
						var origin = this._selectedChild;
						this._selectedChild = widget;
						this.selectedChildId = widget.id;
						if (origin !== widget) {
							promises.push(this.hide(origin));
						}
					}
					widget.open = true;
					widget.headerNode.checked = true;
				} else {
					widget.headerNode.checked = true;
					valid = false;
				}
			}
			if (valid) {
				promises.push(this._doTransition(widget, params));
			}
			return Promise.all(promises);
		},

		addChild: dcl.superCall(function (sup) {
			return function (node, insertIndex) {
				return sup.apply(this, [this._setupUpgradedChild(node), insertIndex]);
			};
		})

	});

	return register("d-accordion", [HTMLElement, Accordion]);
});