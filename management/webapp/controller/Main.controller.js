sap.ui.define([
		"sap/ui/core/mvc/Controller"
	],
	/**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
	function (Controller) {
		"use strict";

		return Controller.extend("emp_mgmt.management.controller.Main", {
			onInit: function () {

            },
            
        /** 
        *----------Manejadores de eventos----------
        */
            onPressTileFirmarPedido: function(){
                const sURL = "https://ccd21bbbtrial-dev-logali-approuter.cfapps.eu10.hana.ondemand.com/logaligroupEmployees/index.html";
                window.open(sURL);
            },

            onPressCrearEmpleado: function(){
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("CrearEmpleado", {}, false);
            },

            onPressVerEmpleados: function(){
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("VisualizarEmpleado", {}, false);
            }

		});
	});
