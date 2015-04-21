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
		icon1 : "",
		icon2 : "",
		singleOpen: true,

		//Overrides Container.getChildren method to return the panel content rather than the panels
		getChildren: function () {
			var children = [];
			for (var i = 0, l = this.children.length; i < l; i++) {
				if (this.children[i].baseClass === "d-panel") {
					children.push(this.children[i].containerNode);
				}
			}
			return children;
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
				var toShow = this.singleOpen ? child === this._selectedChild : child.parentNode.open;
				if (toShow) {
					this.show(child);
				} else {
					this.hide(child);
				}
			}, this);
		},

		attachedCallback: function () {
			this._setChildrenInitialVisibility();
		},

		preRender: function () {
			for (var i = 0, l = this.children.length; i < l; i++) {
				this._setupChild(this.children[i]);
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
			if (child.baseClass !== "d-panel") {
				setVisibility(child, false); //Remove child if not a d-panel ?
				return;
			}
			var toggle = new ToggleButton({
				label: child.headerNode.textContent,
				iconClass: child.icon1,
				checkedIconClass: child.icon2,
				checked: child.open
			});
			toggle.placeAt(child.headerNode, "replace");
			toggle.on("click", this._changeHandler.bind(this));
			child.headerNode = toggle;
			//This only makes sense if singleOption, but at this stage members have not been initialized yet
			if (child.open) {
				this._selectedChild = child.containerNode;
			}
		},

		changeDisplay: function (widget, params) {
			if (params.hide === true) {
				setVisibility(widget, false);
				$(widget.parentNode).removeClass("fill");
				widget.parentNode.headerNode.checked = false;
				//transition
				widget.parentNode.open = false;
				return Promise.resolve();
			} else {
				if (this.singleOpen) {
					var origin = this._selectedChild;
					this._selectedChild = widget;
					if (origin !== widget) {
						setVisibility(origin, false);
						$(origin.parentNode).removeClass("fill");
						origin.parentNode.open = false;
						origin.parentNode.headerNode.checked = false;
					} else {
						origin.parentNode.headerNode.checked = true;
					}
				}
				setVisibility(widget, true);
				$(widget.parentNode).addClass("fill");
				widget.parentNode.open = true;
				return Promise.resolve();
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