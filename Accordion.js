define(["dcl/dcl",
	"decor/sniff",
	"requirejs-dplugins/Promise!",
	"delite/register",
	"dpointer/events",
	"requirejs-dplugins/jquery!attributes/classes",
	"delite/DisplayContainer",
	"./Panel",
	"./ToggleButton",
	"delite/theme!./Accordion/themes/{{theme}}/Accordion.css"
], function (dcl, has, Promise, register, events, $, DisplayContainer, Panel, ToggleButton) {

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

	var Accordion = dcl(DisplayContainer, {

		baseClass: "d-accordion",
		selectedChildId : "",
		openIconClass : "",
		closedIconClass : "",
		singleOpen: true,
		animate: true,
		_panelList: null,

		_setSelectedChildIdAttr: function (childId) {
			var childNode = this.ownerDocument.getElementById(childId);
			if (childNode) {
				this._set("selectedChildId", childId);
				if (childNode.nodeName.toLowerCase() === "d-panel" && this.attached && childNode.attached) {
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

		_setupAttachedPanel: function (child) {
			var panel = child;
			if (panel.baseClass !== "d-panel") {
				panel = new Panel({
					label: child.getAttribute("label") || "Default header",
					iconClass: child.getAttribute("iconClass"),
					closedIconClass: child.getAttribute("closedIconClass")
				});
				panel.id = "panel_" + child.id;
				panel.containerNode.appendChild(child.cloneNode(true));
			}
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
			// Declarative case (children specified declaratively inside the declarative Accordion)
			for (var i = 0, l = this.children.length; i < l; i++) {
				if (this.children[i].nodeName.toLowerCase() === "d-panel") {
					if (!this.children[i].attached) {
						this._setupNoAttachedPanel(this.children[i]);
					} else {
						this._panelList.push(this._setupAttachedPanel(this.children[i]));
					}
				} else {
					var panel = this._setupAttachedPanel(this.children[i]);
					this._panelList.push(panel);
					panel.placeAt(this.children[i], "replace");
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
			if (this._selectedChild) {
				//Declarative case, where selectedChild wasn't a panel
				if (this._selectedChild.nodeName.toLowerCase() !== "d-panel" && !this._selectedChild.parentNode) {
					this._selectedChild = this.ownerDocument.getElementById("panel_" + this._selectedChild.id);
				}
				if (this._selectedChild.attached) {
					this.show(this._selectedChild/*, noTransition*/);
				}
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