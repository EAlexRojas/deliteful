define(["dcl/dcl",
	"delite/register",
	"requirejs-dplugins/i18n!./Accordion/nls/messages",
	"dpointer/events",
	"delite/DisplayContainer",
	"./Panel",
	"./ToggleButton",
	"delite/theme!./Accordion/themes/{{theme}}/Accordion.css"
], function (dcl, register, messages, events, DisplayContainer, Panel, ToggleButton) {

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
		nls: messages,
		selectedChildId : "",
		icon1 : "",
		icon2 : "",
		singleOpen: true,

		//Overrides Container.getChildren method to return the panel content rather than the panels
		getChildren: function () {
			var children = [];
			for (var i = 0, l = this.children.length; i < l; i++) {
				children[i] = this.children[i].baseClass === "d-panel" ? this.children[i].children[1] : this.children[i];
			}
			return children;
		},

		_setSelectedChildIdAttr: function (child) {
			var childNode = this.ownerDocument.getElementById(child);
			if (childNode) {
				var node;
				if (childNode.baseClass === "d-panel") {
					childNode.headerNode.checked = true;
					node = childNode.containerNode;
				} else {
					childNode.parentNode.parentNode.headerNode.checked = true;
					node = childNode.parentNode;
				}
				if (this.attached) {
					this.show(node);
				} else {
					this._pendingChild = node;
				}
			}
		},

		_setChildrenVisibility: function () {
			var children = this.getChildren();
			//if (this.singleOpen) {
			//	if (!this._selectedChild && children.length > 0) {
			//		this._selectedChild = children[0];
			//	}
			//}
			children.forEach(function (child) {
				setVisibility(child, this.singleOpen ? child === this._selectedChild : false);
			}, this);
		},

		attachedCallback: function () {
			this._setChildrenVisibility();
			//var noTransition = {transition: "none"};
			var children = this.getChildren();
			if (this._pendingChild) {
				this.show(this._pendingChild/*, noTransition*/);
				this._pendingChild = null;
			} else if (this.singleOpen && children.length > 0) {
				children[0].parentNode.headerNode.checked = true;
				this.show(children[0]/*, noTransition*/);
			}
		},

		preRender: function () {
			for (var i = 0, l = this.children.length; i < l; i++) {
				var panel = this._setupChild(this.children[i]);
				this.replaceChild(panel, this.children[i]);
			}
		},

		_changeHandler: function(event) {
			if (this.singleOpen) {
				this.show(event.target.parentNode.containerNode);
			} else {
				if(event.target.checked) {
					this.hide(event.target.parentNode.containerNode);
				} else {
					this.show(event.target.parentNode.containerNode);
				}
			}
		},

		_setupChild: function (child) {
			var panel = child;
			if (panel.baseClass !== "d-panel") {
				panel = new Panel({
					label: child.getAttribute("label") || "Default header",
					icon: this.icon1
				});
				panel.containerNode.appendChild(child.cloneNode(true));
			}
			var toggle = new ToggleButton({
				label: panel.headerNode.textContent
			});
			toggle.placeAt(panel.headerNode, "replace");
			panel.headerNode = toggle;
			panel.headerNode.on("pointerup", this._changeHandler.bind(this));
			panel.icon2 = this.icon2;
			panel.isCollapsible = true;
			panel.parent = this;
			return panel;
		},

		changeDisplay: function (widget, params) {
			if (params.hide === true) {
				setVisibility(widget, false);
				//transition
				return Promise.resolve();
			} else {
				if (this.singleOpen) {
					var origin = this._selectedChild;
					this._selectedChild = widget;
					if (origin !== widget) {
						setVisibility(origin, false);
						origin.parentNode.headerNode.checked = false;
					} else {
						origin.parentNode.headerNode.checked = false;
					}
				}
				setVisibility(widget, true);
				return Promise.resolve();
			}
		},

		show: dcl.superCall(function (sup) {
			return function (dest, params) {
				if (!this._selectedChild && this.children.length > 0) {
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