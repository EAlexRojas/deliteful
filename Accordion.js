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

	var Accordion = dcl(DisplayContainer, {

		baseClass: "d-accordion",
		icon1 : "",
		icon2 : "",
		singleOpen: true,
		_panelList: null,

		_changeHandler: function(event) {
			var panel = event.target.parentNode;
			if (panel.baseClass !== "d-panel") {
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
			var toggle = new ToggleButton({
				label: child.label,
				iconClass: child.icon1 || this.icon1,
				checkedIconClass: child.icon2 || this.icon2,
				checked: child.open
			});
			toggle.placeAt(child.headerNode, "replace");
			toggle.on("click", this._changeHandler.bind(this));
			child.headerNode = toggle;
			if (this.singleOpen && child.open) {
				this._selectedChild = child.containerNode;
			}
			setVisibility(child.containerNode, !this.singleOpen && child.open);
			child.open = false;
			return child;
		},

		_noAttachedPanels: 0,

		_setupNoAttachedPanel: function (panel) {
			panel.parent = this;
			this._noAttachedPanels++;
			panel.addEventListener("customelement-attached", this._attachedlistener = function () {
				this.removeEventListener("customelement-attached", this._attachedlistener);
				this.parent._panelList.push(this.parent._setupAttachedPanel(this));
				if (--this.parent._noAttachedPanels === 0) {
					this.parent.deliver();
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
			//If singleOpen, the default open panel is the first one
			if (this.singleOpen && !this._selectedChild && this._panelList.length > 0) {
				this._selectedChild = this._panelList[0];
			}
			//Show selectedChild if exists
			if (this._selectedChild && this._selectedChild.attached) {
				this.show(this._selectedChild/*, noTransition*/);
			}
		},

		preRender: function () {
			this._panelList = [];
		},

		refreshRendering: function(props) {
			if ("_noAttachedPanels" in  props) {
				console.log("_noAttachedPanels");
				if (this.singleOpen && !this._selectedChild && this._panelList.length > 0) {
					this._selectedChild = this._panelList[0];
				}
				if (this._selectedChild && this._selectedChild.attached) {
					this.show(this._selectedChild/*, noTransition*/);
				}
			}
		},

		changeDisplay: function (widget, params) {
			if (params.hide === true) {
				setVisibility(widget.containerNode, false);
				$(widget).removeClass("fill");
				widget.headerNode.checked = false;
				widget.open = false;
				//transition
			} else {
				if (this.singleOpen) {
					var origin = this._selectedChild;
					this._selectedChild = widget;
					if (origin !== widget) {
						this.hide(origin);
					}
				}
				setVisibility(widget.containerNode, true);
				$(widget).addClass("fill");
				widget.headerNode.checked = true;
				widget.open = true;
				//transition
			}
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
		})

	});

	return register("d-accordion", [HTMLElement, Accordion]);
});