define(["dcl/dcl",
	"delite/register",
	"dpointer/events",
	"requirejs-dplugins/jquery!attributes/classes",
	"delite/DisplayContainer",
	"./ToggleButton",
	"delite/theme!./Accordion/themes/{{theme}}/Accordion.css"
], function (dcl, register, events, $, DisplayContainer, ToggleButton) {

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

	function listenTransitionEvents(element, callback) {
		var events = ["transitionend", "webkitTransitionEnd"];
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
		icon1 : "",
		icon2 : "",
		singleOpen: true,
		animate: true,
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
					if(this._numOpenPanels > 1) {
						this.hide(panel);
					} else {
						panel.headerNode.checked = true;
					}
				} else {
					this.show(panel);
				}
			}
		},

		_setupAttachedPanel: function (panel) {
			var toggle = new ToggleButton({
				label: panel.label,
				iconClass: panel.icon1 || this.icon1,
				checkedIconClass: panel.icon2 || this.icon2
			});
			toggle.placeAt(panel.headerNode, "replace");
			toggle.on("click", this._changeHandler.bind(this));
			panel.headerNode = toggle;
			setVisibility(panel.containerNode, false);
			panel.open = false;
			$(panel).addClass("d-accordion-closed-panel");
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
			//If singleOpen, the default open panel is the first one
			if (/*this.singleOpen &&*/ !this._selectedChild && this._panelList.length > 0) {
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

		_doTransition: function(panel, params) {
			if (params.hide) {
				$(panel).toggleClass("d-accordion-animate", this.animate);
				$(panel).removeClass("d-accordion-open-panel").addClass("d-accordion-closed-panel");
				if (this.animate) {
					listenTransitionEvents(panel, function (element) {
						setVisibility(element.containerNode, false);
					});
				} else {
					setVisibility(panel.containerNode, false);
				}
			} else {
				$(panel).toggleClass("d-accordion-animate", this.animate);
				$(panel).removeClass("d-accordion-closed-panel").addClass("d-accordion-open-panel");
				if (this.animate) {
					listenTransitionEvents(panel, function (element) {});
				}
				setVisibility(panel.containerNode, true);
			}
		},

		changeDisplay: function (widget, params) {
			if (params.hide) {
				widget.open = false;
				widget.headerNode.checked = false;
				this._numOpenPanels--;
			} else {
				if (this.singleOpen) {
					var origin = this._selectedChild;
					this._selectedChild = widget;
					if (origin !== widget) {
						this.hide(origin);
					}
				}
				widget.open = true;
				widget.headerNode.checked = true;
				this._numOpenPanels++;
			}
			this._doTransition(widget, params);
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