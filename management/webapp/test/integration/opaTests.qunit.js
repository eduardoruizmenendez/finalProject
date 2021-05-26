/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"emp_mgmt/management/test/integration/AllJourneys"
	], function () {
		QUnit.start();
	});
});
