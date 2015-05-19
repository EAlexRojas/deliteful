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
		if (node) {
			if (val) {
				node.style.visibility = "visible";
				node.style.display = "";
			} else {
				node.style.visibility = "hidden";
				node.style.display = "none";
			}
		}
	}

	function listenAnimationEvents(element, callback) {
		var events = ["animationend", "webkitAnimationEnd", "MSAnimationEnd"];
		events.forEach(function (event) {
			var tmp = {};
			var listener = (function (el, ev, d) {
				return function () {
					callback(el, ev);
					d.handler.remove();
				};
			})(element, event, tmp);
			tmp.handler = element.on(event, listener);
		});
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
	 *     <d-panel id="p&nel1">...</d-panel>
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

		_setSelectedChildIdAttr: function (childId) {
			var childNode = this.ownerDocument.getElementById(childId);
			if (childNode) {
				this._set("selectedChildId", childId);
				if (this.attached && childNode.attached) {
					this.show(childNode);
				} else {
					this._selectedChild = childNode;
				}
			}
		},

		_getSelectedChildIdAttr: function () {
			if (this.singleOpen) {
				return this._selectedChild ? this._selectedChild.id : "";
			} else {
				return this._get("selectedChildId");
			}
		},

		_numOpenPanels: 0,

		_changeHandler: function(event) {
			var panel = event.target.parentNode;
			//Case when the event is fired by the label or the icon
			if (panel.nodeName.toLowerCase() !== "d-panel") {
				panel = panel.parentNode;
			}
			if (this.singleOpen) {
				this.show(panel);
			} else {
				if(panel.open) {
					this.hide(panel);
				} else {
					this.show(panel);
				}
			}
		},

		_setupAttachedPanel: function (panel) {
			var toggle = new ToggleButton({
				label: panel.label,
				iconClass: panel.closedIconClass || this.closedIconClass,
				checkedIconClass: panel.iconClass || this.openIconClass
			});
			toggle.placeAt(panel.headerNode, "replace");
			toggle.on("click", this._changeHandler.bind(this));
			panel.headerNode = toggle;
			setVisibility(panel.containerNode, false);
			panel.open = false;
			return panel;
		},

		_noAttachedPanels: 0,

		_setupNoAttachedPanel: function (panel) {
			panel.accordion = this;
			this._noAttachedPanels++;
			panel.addEventListener("customelement-attached", this._attachedlistener = function () {
				this.removeEventListener("customelement-attached", this._attachedlistener);
				this.accordion._panelList.push(this.accordion._setupAttachedPanel(this));
				if (--this.accordion._noAttachedPanels === 0) {
					this.accordion.deliver();
				}
			});
		},

		attachedCallback: function () {
			// Declarative case (panels specified declaratively inside the declarative Accordion)
			var panels = this.querySelectorAll("d-panel");
			if (panels) {
				for (var i = 0, l = panels.length; i < l; i++) {
					if (!panels[i].attached) {
						this._setupNoAttachedPanel(panels[i]);
					} else {
						this._panelList.push(this._setupAttachedPanel(panels[i]));
					}
				}
			}
			this._showOpenPanel();
		},

		preRender: function () {
			this._panelList = [];
		},

		_showOpenPanel: function () {
			//The default open panel is the first one
			if ( !this._selectedChild && this._panelList.length > 0) {
				this._selectedChild = this._panelList[0];
			}
			//Show selectedChild if exists
			if (this._selectedChild && this._selectedChild.attached) {
				this.show(this._selectedChild);
			}
		},

		refreshRendering: function(props) {
			if ("_noAttachedPanels" in  props) {
				console.log("_noAttachedPanels");
				this._showOpenPanel();
			}
		},

		_supportTransition: function () {
			//Transition events are broken if the widget is not visible
			var parent = this;
			while (parent && parent.style.display !== "none" && parent !== this.ownerDocument.documentElement) {
				parent = parent.parentNode;
			}
			var visible =  parent === this.ownerDocument.documentElement;

			//Flexbox animation is not supported on IE 11 and before
			return visible && (has("ie") ? has("ie") > 11 : true);
		},

		_doTransition: function(panel, params) {
			if (params.hide) {
				if (this.animate && this._supportTransition()) {
					//To avoid hiding the panel title bar on animation
					panel.style.minHeight = window.getComputedStyle(panel.headerNode).getPropertyValue("height");
					$(panel).addClass("d-accordion-closeAnimation");
					$(panel).removeClass("d-accordion-open-panel");
					panel.containerNode.style.overflow = "hidden"; //To avoid scrollBar on animation
					listenAnimationEvents(panel, function (element) {
						setVisibility(element.containerNode, false);
						$(element).removeClass("d-accordion-closeAnimation");
						panel.containerNode.style.overflow = "auto";
						panel.style.minHeight = "";
					});
				} else {
					$(panel).removeClass("d-accordion-open-panel");
					setVisibility(panel.containerNode, false);
				}
			} else {
				if (this.animate && this._supportTransition()) {
					//To avoid hiding the panel title bar on animation
					panel.style.minHeight = window.getComputedStyle(panel.headerNode).getPropertyValue("height");
					$(panel).addClass("d-accordion-openAnimation");
					setVisibility(panel.containerNode, true);
					panel.containerNode.style.overflow = "hidden"; //To avoid scrollBar on animation
					listenAnimationEvents(panel, function (element) {
						$(panel).addClass("d-accordion-open-panel");
						$(element).removeClass("d-accordion-openAnimation");
						panel.containerNode.style.overflow = "auto";
						panel.style.minHeight = "";
					});
				} else {
					$(panel).addClass("d-accordion-open-panel");
					setVisibility(panel.containerNode, true);
				}
			}
		},

		changeDisplay: function (widget, params) {
			var valid = true;
			if (params.hide) {
				if (widget.open === true) {
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
				if (widget.open === false) {
					this._numOpenPanels++;
					if (this.singleOpen) {
						var origin = this._selectedChild;
						this._selectedChild = widget;
						if (origin !== widget) {
							this.hide(origin);
						}
					}
					widget.open = true;
					widget.headerNode.checked = true;
				} else {
					widget.headerNode.checked = true;
					valid = false;
				}
			}
			return valid ? this._doTransition(widget, params) : Promise.resolve(true);
		},

		show: dcl.superCall(function (sup) {
			return function (dest, params) {
				return sup.apply(this, [dest, params]);
			};
		}),

		hide: dcl.superCall(function (sup) {
			return function (dest, params) {
				var args = {hide: true};
				dcl.mix(args, params || {});
				return this.changeDisplay(dest, args);
			};
		}),

		addChild: dcl.superCall(function (sup) {
			return function (node, insertIndex) {
				return sup.apply(this, [this._setupAttachedPanel(node), insertIndex]);
			};
		})

	});

	return register("d-accordion", [HTMLElement, Accordion]);
});