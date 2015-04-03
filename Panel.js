define(["dcl/dcl",
	"delite/register",
	"delite/DisplayContainer",
	"delite/handlebars!./Panel/Panel.html",
    "delite/theme!./Panel/themes/{{theme}}/Panel.css"
], function (dcl, register, DisplayContainer, template) {

	var Panel = dcl(DisplayContainer, {
		baseClass: "d-panel",
		label: "",
		icon1: "",
		icon2: "", //When used inside an accordion
		template: template
	});

	return register("d-panel", [HTMLElement, Panel]);
});