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

		//Overrides Container.getChildren method to return the panel content rather than the panels
		getChildren: function () {
			var children = [];
			for (var i = 0, l = this.children.length; i < l; i++) {
				children[i] =  this.children[i].containerNode;
			}
			return children;
		},

		_setSelectedChildIdAttr: function (childId) {
			var childNode = this.ownerDocument.getElementById(childId);
			if (childNode) {
				var node;
				if (childNode.baseClass === "d-panel") {
					node = childNode.containerNode;
				} else {
					node = childNode.parentNode;
				}
				node.parentNode.headerNode.checked = true;
				if (this.attached) {
					this.show(node);
				} else {
					this._pendingChild = node;
				}
				this._set("selectedChildId", childId);
			}
		},

		_getSelectedChildIdAttr: function () {
			if (this.singleOpen) {
				return this._selectedChild ? this._selectedChild.id : "";
			} else {
				return this.selectedChildId;
			}
		},

		_setIcon1Attr: function (icon1) {
			for (var i = 0, l = this.children.length; i < l; i++) {
				if (!this.children[i].headerNode.iconClass){
					this.children[i].headerNode.iconClass = icon1;
				}
			}
			this._set("icon1", icon1);
		},

		_setIcon2Attr: function (icon2) {
			for (var i = 0, l = this.children.length; i < l; i++) {
				if (!this.children[i].headerNode.checkedIconClass){
					this.children[i].headerNode.checkedIconClass = icon2;
				}
			}
			this._set("icon2", icon2);
		},

		_setChildrenInitialVisibility: function () {
			this.getChildren().forEach(function (child) {
				setVisibility(child, this.singleOpen ? child === this._selectedChild : false);
			}, this);
		},

		attachedCallback: function () {
			this._setChildrenInitialVisibility();
			//var noTransition = {transition: "none"};
			var children = this.getChildren();
			if (this._pendingChild) {
				this.show(this._pendingChild/*, noTransition*/);
				this._pendingChild = null;
			} else if (this.singleOpen && children.length > 0) {
				children[0].parentNode.headerNode.checked = true;
				this.show(children[0]);
			}
		},

		preRender: function () {
			for (var i = 0, l = this.children.length; i < l; i++) {
				var panel = this._setupChild(this.children[i]);
				this.replaceChild(panel, this.children[i]);
			}
		},

		_changeHandler: function(event) {
			var panel = event.target.parentNode;
			if (panel.baseClass !== "d-panel") {
				panel = panel.parentNode;
			}
			if (this.singleOpen) {
				this.show(panel.containerNode);
			} else {
				if(panel.open) {
					this.hide(panel.containerNode);
				} else {
					this.show(panel.containerNode);
				}
			}
		},

		_setupChild: function (child) {
			var panel = child;
			if (panel.baseClass !== "d-panel") {
				panel = new Panel({
					label: child.getAttribute("label") || "Default header"
				});
				panel.containerNode.appendChild(child.cloneNode(true));
			}
			var toggle = new ToggleButton({
				label: panel.headerNode.textContent,
				iconClass: panel.icon1,
				checkedIconClass: panel.icon2
			});
			toggle.placeAt(panel.headerNode, "replace");
			toggle.on("click", this._changeHandler.bind(this));
			panel.headerNode = toggle;
			return panel;
		},

		changeDisplay: function (widget, params) {
			if (params.hide === true) {
				setVisibility(widget, false);
				$(widget.parentNode).removeClass("fill");
				widget.parentNode.headerNode.checked = false;
				widget.parentNode.open = false;
				//transition
			} else {
				if (this.singleOpen) {
					var origin = this._selectedChild;
					this._selectedChild = widget;
					if (origin !== widget) {
						this.hide(origin);
					} else {
						origin.parentNode.headerNode.checked = true;
					}
				}
				setVisibility(widget, true);
				$(widget.parentNode).addClass("fill");
				widget.parentNode.open = true;
				//transition
			}
		},

		show: dcl.superCall(function (sup) {
			return function (dest, params) {
				if (this.singleOpen && !this._selectedChild && this.children.length > 0) {
					// The default visible child is the first one.
					this._selectedChild = this.getChildren()[0];
				}
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