define(["dcl/dcl",
	"delite/register",
	"dpointer/events",
	"requirejs-dplugins/jquery!attributes/classes",
	"delite/DisplayContainer",
	"./Panel",
	"./ToggleButton",
	"delite/theme!./Accordion/themes/{{theme}}/Accordion.css"
], function (dcl, register, events, $, DisplayContainer, Panel, ToggleButton) {

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
		selectedChildId : "",
		icon1 : "",
		icon2 : "",
		singleOpen: true,
		_panelList: null,

		_setSelectedChildIdAttr: function (childId) {
			var childNode = this.ownerDocument.getElementById(childId);
			if (childNode) {
				this._set("selectedChildId", childId);
				if (childNode.nodeName.toLocaleLowerCase() === "d-panel" && this.attached && childNode.attached) {
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
			var panel = child;
			if (panel.baseClass !== "d-panel") {
				panel = new Panel({
					label: child.getAttribute("label") || "Default header",
					icon1: child.getAttribute("icon1"),
					icon2: child.getAttribute("icon2")
				});
				panel.id = "panel_" + child.id;
				panel.containerNode.appendChild(child.cloneNode(true));
			}
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
			return panel;
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
			this.showOpenPanels();
		},

		preRender: function () {
			this._panelList = [];
		},

		showOpenPanels: function () {
			//If singleOpen, the default open panel is the first one
			if (this.singleOpen && !this._selectedChild && this._panelList.length > 0) {
				this._selectedChild = this._panelList[0];
			}
			//Show selectedChild if exists
			if (this._selectedChild) {
				//Declarative case, where selectedChild wasn't a panel
				if (this._selectedChild.nodeName.toLocaleLowerCase() !== "d-panel" && !this._selectedChild.parentNode) {
					this._selectedChild = this.ownerDocument.getElementById("panel_" + this._selectedChild.id);
				}
				if (this._selectedChild.attached) {
					this.show(this._selectedChild/*, noTransition*/);
				}
			}
		},

		preRender: function () {
			this._panelList = [];
		},

		refreshRendering: function(props) {
			if ("_noAttachedPanels" in  props) {
				console.log("_noAttachedPanels");
				this.showOpenPanels();
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