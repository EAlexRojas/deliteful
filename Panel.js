define(["dcl/dcl",
	"delite/register",
	"delite/Container",
	"delite/handlebars!./Panel/Panel.html",
    "delite/theme!./Panel/themes/{{theme}}/Panel.css"
], function (dcl, register, Container, template) {

	var Panel = dcl(Container, {
		baseClass: "d-panel",
		label: "",
		icon1: "",
		icon2: "", //When used inside an accordion
		open: false, //When used inside an accordion
		template: template
	});

	return register("d-panel", [HTMLElement, Panel]);
});