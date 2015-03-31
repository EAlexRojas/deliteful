define(["dcl/dcl",
	"delite/register",
    "requirejs-dplugins/i18n!./Accordion/nls/messages",
    "dpointer/events",
	"delite/DisplayContainer",
    "delite/theme!./Accordion/themes/{{theme}}/Accordion.css"
], function (dcl, register, messages, events, DisplayContainer) {

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

		getChildren: function () {
			var children = [];
			for (var i = 0; i < this.children.length;i++) {
				children[i] = this.children[i].className === "-d-panel" ? this.children[i].children[1].firstChild : this.children[i];
			}
			return children;
		},

		_setSelectedChildIdAttr: function (child) {
			var childNode = this.ownerDocument.getElementById(child);
			if (childNode) {
				this._selectedChild = childNode;
				this._setChildrenVisibility();
			}
		},

		_setChildrenVisibility: function () {
			var children = this.getChildren();
			if (!this._selectedChild && children.length > 0) {
				this._selectedChild = children[0];
			}
			children.forEach(function (child) {
				setVisibility(child.parentNode, child === this._selectedChild);
			}, this);
		},

		preRender: function () {
			var children = this.getChildren();
			children.forEach(function (child) {
				var container = this._setupChild(child);
				this.replaceChild(container, child);
			}, this);
		},

		_setupChild: function (child) {
			var container = this.ownerDocument.createElement("div");
			container.className = "-d-panel";
			var header = this.ownerDocument.createElement("header");
			header.innerHTML = child.title || "New Header";
			header.className = "-d-panel-header";
			container.appendChild(header);
			var content = this.ownerDocument.createElement("div");
			content.className = "-d-panel-content";
			content.appendChild(child.cloneNode(true));
			container.appendChild(content);
			container.content = child;
			child.container = container;
			return container;
		},

		postRender: function () {
			this._setChildrenVisibility();
		}

	});

	return register("d-accordion", [HTMLElement, Accordion]);
});