define(["intern",
	"intern!object",
	"intern/dojo/node!leadfoot/helpers/pollUntil",
	"intern/chai!assert",
	"require",
	"dojo/promise/all"
], function (intern, registerSuite, pollUntil, assert, require, all) {
	var PAGE = "./Accordion.html";

	function checkHasClass(classes, className) {
		classes = classes.trim().split(/\s+/g);
		return classes.indexOf(className) !== -1 ? true : null;
	}

	function checkHasNotClass(classes, className) {
		classes = classes.trim().split(/\s+/g);
		return classes.indexOf(className) === -1 ? true : null;
	}

	function checkPanelIsOpen(remote, panel, animation) {
		if (/internet explorer/.test(remote.environmentType.browserName)) {
			animation = false;
		}
		return remote
			.findById(panel)
			.getProperty("open")
			.then(function (open) {
				assert.isTrue(open, "This panel should be open");
			})
			.findByCssSelector(".d-toggle-button")
			.getProperty("checked")
			.then(function (checked) {
				assert.isTrue(checked, "This button should be checked");
			})
			.isDisplayed()
			.then(function (displayed) {
				assert.isTrue(displayed, "This button should be visible");
			})
			.end()
			.findById(panel)
			.findByCssSelector(".d-panel-content")
			.isDisplayed()
			.then(function (displayed) {
				assert.isTrue(displayed, "The content of this panel should be visible");
			})
			.sleep(animation ? 300 : 0) //Animation time
			.getAttribute("class")
			.then(function (classes) {
				checkHasClass(classes, "d-accordion-open-panel");
			})
			.end();
	}

	function checkPanelIsClosed(remote, panel, animation) {
		if (/internet explorer/.test(remote.environmentType.browserName)) {
			animation = false;
		}
		return remote
			.findById(panel)
			.getProperty("open")
			.then(function (open) {
				assert.isFalse(open, "This panel should not be open");
			})
			.findByCssSelector(".d-toggle-button")
			.getProperty("checked")
			.then(function (checked) {
				assert.isFalse(checked, "This button should not be checked");
			})
			.isDisplayed()
			.then(function (displayed) {
				assert.isTrue(displayed, "This button should be visible");
			})
			.end()
			.findById(panel)
			.findByCssSelector(".d-panel-content")
			.getAttribute("class")
			.then(function (classes) {
				assert.isTrue(checkHasNotClass(classes, "d-accordion-open-panel",
					"The content of this panel should not be visible"));
			})
			.sleep(animation ? 300 : 0) //Animation time
			.isDisplayed()
			.then(function (displayed) {
				assert.isFalse(displayed, "The content of this panel should not be visible");
			})
			.end();
	}

	registerSuite({
		name: "Accordion tests",
		setup: function () {
			var remote = this.remote;
			return remote
				.get(require.toUrl(PAGE))
				.then(pollUntil("return ready ? true : null;", [],
					intern.config.WAIT_TIMEOUT, intern.config.POLL_INTERVAL));
		},
		"SingleOpen Mode": {
			"Check opening panel": function () {
				var remote = this.remote;
				return remote
					.execute("return document.getElementById('panel2').headerNode")
					.then(function (button) {
						button.click();
					})
					.end()
					.then(function () {
						var remotes = [];
						remotes.push(checkPanelIsClosed(remote, "panel1", true));
						remotes.push(checkPanelIsOpen(remote, "panel2", true));
						remotes.push(checkPanelIsClosed(remote, "panel3", false));
						return all(remotes);
					});
			},
			"Opening panel by clicking on the label": function () {
				var remote = this.remote;
				return remote
					.execute("return document.getElementById('panel3').headerNode.labelNode")
					.then(function (label) {
						label.click();
					})
					.end()
					.then(function () {
						var remotes = [];
						remotes.push(checkPanelIsClosed(remote, "panel1", false));
						remotes.push(checkPanelIsClosed(remote, "panel2", true));
						remotes.push(checkPanelIsOpen(remote, "panel3", true));
						return all(remotes);
					});
			},
			"Opening panel by clicking on the icon": function () {
				var remote = this.remote;
				return remote
					.execute("return document.getElementById('panel2').headerNode.iconNode")
					.then(function (icon) {
						icon.click();
					})
					.end()
					.then(function () {
						var remotes = [];
						remotes.push(checkPanelIsClosed(remote, "panel1", false));
						remotes.push(checkPanelIsOpen(remote, "panel2", true));
						remotes.push(checkPanelIsClosed(remote, "panel3", true));
						return all(remotes);
					});
			},
			"Trying to close the open panel": function () {
				var remote = this.remote;
				return remote
					.execute("return document.getElementById('panel2').headerNode")
					.then(function (button) {
						button.click();
					})
					.end()
					.then(function () {
						var remotes = [];
						remotes.push(checkPanelIsClosed(remote, "panel1", false));
						remotes.push(checkPanelIsOpen(remote, "panel2", false));
						remotes.push(checkPanelIsClosed(remote, "panel3", false));
						return all(remotes);
					});
			}
		},
		"MultipleOpen Mode": {
			"setup": function () {
				var remote = this.remote;
				return remote
					.execute("document.getElementById('accordion').style.display = 'none'")
					.execute("document.getElementById('accordion2').style.display = ''");
			},
			"Check opening all panels": function () {
				var remote = this.remote;
				return remote
					.execute("return document.getElementById('panel22').headerNode")
					.then(function (button) {
						button.click();
					})
					.end()
					.execute("return document.getElementById('panel23').headerNode")
					.then(function (button) {
						button.click();
					})
					.end()
					.then(function () {
						var remotes = [];
						remotes.push(checkPanelIsOpen(remote, "panel21", false));
						remotes.push(checkPanelIsOpen(remote, "panel22", true));
						remotes.push(checkPanelIsOpen(remote, "panel23", true));
						return all(remotes);
					});
			},
			"Check closing panel": function () {
				var remote = this.remote;
				return remote
					.execute("return document.getElementById('panel22').headerNode")
					.then(function (button) {
						button.click();
					})
					.end()
					.then(function () {
						var remotes = [];
						remotes.push(checkPanelIsOpen(remote, "panel21", false));
						remotes.push(checkPanelIsClosed(remote, "panel22", true));
						remotes.push(checkPanelIsOpen(remote, "panel23", false));
						return all(remotes);
					});
			},
			"Closing panel by clicking on the label": function () {
				var remote = this.remote;
				return remote
					.execute("return document.getElementById('panel23').headerNode.labelNode")
					.then(function (label) {
						label.click();
					})
					.end()
					.then(function () {
						var remotes = [];
						remotes.push(checkPanelIsOpen(remote, "panel21", false));
						remotes.push(checkPanelIsClosed(remote, "panel22", true));
						remotes.push(checkPanelIsClosed(remote, "panel23", true));
						return all(remotes);
					});
			},
			"Trying to close last open panel": function () {
				var remote = this.remote;
				return remote
					.execute("return document.getElementById('panel21').headerNode")
					.then(function (button) {
						button.click();
					})
					.end()
					.then(function () {
						var remotes = [];
						remotes.push(checkPanelIsOpen(remote, "panel21", false));
						remotes.push(checkPanelIsClosed(remote, "panel22", false));
						remotes.push(checkPanelIsClosed(remote, "panel23", false));
						return all(remotes);
					});
			}
		}
	});
});