// @ts-nocheck
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
],
	/**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     * @param {typeof sap.ui.json.JSONModel} JSONModel
     */
    function (Controller, JSONModel) {
        "use strict";

        return Controller.extend("emp_mgmt.management.controller.CrearEmpleado", {

            onInit: function () {

            },

            onBeforeRendering: function () {
                this._wizard = this.getView().byId("wizard");
                this._oNavContainer = this.getView().byId("wizardNavContainer");
                this._oWizardContentPage = this.byId("wizardContentPage")
                this.model = new JSONModel();
                this.getView().setModel(this.model);
                this._clear();
            },

            /** 
            *----------Manejadores de eventos----------
            */
            onTipoEmpleadoPulsado: function (oEvent) {
                let tipoEmpleado = oEvent.getParameter("id").toString();
                let tipoEmpleadoModelo, salarioMin, salarioMax, salarioBruto;
                if (tipoEmpleado.includes("botonTipoInterno")) {
                    tipoEmpleadoModelo = 0;
                    salarioMin = 12000;
                    salarioMax = 80000;
                    salarioBruto = 24000;
                } else if (tipoEmpleado.includes("botonTipoAutonomo")) {
                    tipoEmpleadoModelo = 1;
                    salarioMin = 100;
                    salarioMax = 2000;
                    salarioBruto = 400;
                } else if (tipoEmpleado.includes("botonTipoGerente")) {
                    tipoEmpleadoModelo = 2;
                    salarioMin = 50000;
                    salarioMax = 200000;
                    salarioBruto = 70000;
                };
                this.model.setProperty("/TipoEmpleado", tipoEmpleadoModelo);
                this.model.setProperty("/SalarioMin", salarioMin);
                this.model.setProperty("/SalarioMax", salarioMax);
                this.model.setProperty("/SalarioBruto", salarioBruto);
                this._wizard.nextStep();
            },

            validacionDatosEmpleado: function () {

                let tipoEmpleado = this.model.getProperty("/TipoEmpleado");
                let validated = false;

                let nombre = this.model.getProperty("/NombreEmpleado");
                if (nombre !== "") {
                    validated = true;
                } else {
                    validated = false;
                };

                let apellidos = this.model.getProperty("/ApellidosEmpleado");
                if (apellidos !== "" && validated) {
                    validated = true;
                } else {
                    validated = false;
                };

                if (tipoEmpleado === 0 || tipoEmpleado === 2) {
                    let dni = this.model.getProperty("/DNIEmpleado");
                    if (dni !== "" && validated && this._esDNIValido(dni)) {
                        validated = true;
                    } else {
                        validated = false;
                    };
                };

                if (tipoEmpleado === 1) {
                    let cif = this.model.getProperty("/CIFEmpleado");
                    if (cif !== "" && validated) {
                        validated = true;
                    } else {
                        validated = false;
                    };
                };

                let fecha = this.model.getProperty("/FechaIncorporacion");
                if (fecha !== "" && validated) {
                    validated = true;
                } else {
                    validated = false;
                };

                let wizardStep = this.getView().byId("stepDatosEmpleado");
                if (validated) {
                    this._wizard.validateStep(wizardStep);
                } else {
                    this._wizard.invalidateStep(wizardStep);
                }
            },

            validacionDNI: function (oEvent) {
                var dni = oEvent.getParameter("value");
                let inputDNI = oEvent.getSource();
                var valueState = "None";
                if (!this._esDNIValido(dni)) {
                    valueState = "Error";
                };
                inputDNI.setValueState(valueState);
            },

            onAnexosChange: function (oEvent) {
                let oAnexos = oEvent.getSource();
                let oHeaderToken = new sap.m.UploadCollectionParameter({
                    name: "x-csrf-token",
                    value: this.getView().getModel("oData").getSecurityToken()
                });
                oAnexos.addHeaderParameter(oHeaderToken);
            },

            onAnexosBeforeUploadStart: function (oEvent) {
                let oHeaderSlug = new sap.m.UploadCollectionParameter({
                    name: "slug",
                    value: this.getOwnerComponent().SapId + ";" + this.newUserId + ";" + oEvent.getParameter("fileName")
                });
                oEvent.getParameters().addHeaderParameter(oHeaderSlug);
            },

            onWizardComplete: function () {
                let oUploadCollection = this.getView().byId("anexos");
                this.model.setProperty("/ContadorAnexos", oUploadCollection.getItems().length);
                this._oNavContainer.to(this.byId("revisionWizard"));
            },

            onCancelarWizard: function () {
                sap.m.MessageBox.confirm(this.oView.getModel("i18n").getResourceBundle().getText("mensajeCancelarCreacion"), {
                    onClose: function (oAction) {
                        if (oAction === "OK") {
                            this._clear();
                            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                            oRouter.navTo("RouteMain", {}, true);
                        }
                    }.bind(this)
                });
            },

            goToTipoEmpleado: function () {
                this._handleNavigationToStep(0);
            },

            goToDatosEmpleado: function () {
                this._handleNavigationToStep(1);
            },

            goToInfoAdicional: function () {
                this._handleNavigationToStep(2);
            },

            onGuardar: function () {
                let sDni = this.model.getProperty("DNIEmpleado");
                if(sDni === undefined || sDni === ""){
                    sDni = this.model.getProperty("CIFEmpleado");
                }
                
                let body = {
                    "SapId" : this.getOwnerComponent().SapId,
                    "Type" : this.model.getProperty("/TipoEmpleado"),
                    "FirstName" : this.model.getProperty("/NombreEmpleado"),
                    "LastName" : this.model.getProperty("/ApellidosEmpleado"),
                    "Dni" : sDni,
                    "CreationDate" : this.model.getProperty("/FechaIncorporacion"),
                    "UserToSalary": {
                        Ammount : parseFloat(this.model.getProperty("/SalarioBruto")).toString(),
			            Comments : this.model.getProperty("/Comentario"),
			            Waers : "EUR"
                    }
                }
            },

            onCancelar: function () {
                this._handleMessageBoxOpen("{i18n>mensajeCancelarCreacion}", "warning");
            },

            /** 
            *----------Funciones internas----------
            */
            _esDNIValido: function (dni) {
                var esValido;
                var number;
                var letter;
                var letterList;
                var regularExp = /^\d{8}[a-zA-Z]$/;
                //Se comprueba que el formato es válido
                if (regularExp.test(dni) === true) {
                    //Número
                    number = dni.substr(0, dni.length - 1);
                    //Letra
                    letter = dni.substr(dni.length - 1, 1);
                    number = number % 23;
                    letterList = "TRWAGMYFPDXBNJZSQVHLCKET";
                    letterList = letterList.substring(number, number + 1);
                    if (letterList !== letter.toUpperCase()) {
                        esValido = false;
                    } else {
                        esValido = true;
                    }
                } else {
                    esValido = false;
                }
                return esValido;
            },

            _handleNavigationToStep: function (step) {
                var fnAfterNavigate = function () {
                    this._wizard.goToStep(this._wizard.getSteps()[step]);
                    this._oNavContainer.detachAfterNavigate(fnAfterNavigate);
                }.bind(this);

                this._oNavContainer.attachAfterNavigate(fnAfterNavigate);
                this._backToWizardContent();
            },

            _backToWizardContent: function () {
                this._oNavContainer.backToPage(this._oWizardContentPage.getId());
            },

            _handleMessageBoxOpen: function (sMessage, sMessageBoxType) {
                MessageBox[sMessageBoxType](sMessage, {
                    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.YES) {
                            this._handleNavigationToStep(0);
                            this._wizard.discardProgress(this._wizard.getSteps()[0]);
                        }
                    }.bind(this)
                });
            },

            _clear: function () {
                this.getView().byId("DNIEmpleado").setValueState("Error");
                if (this._wizard !== undefined) {
                    let pasoTipoEmpleado = this._wizard.getSteps()[0];
                    this._wizard.goToStep(pasoTipoEmpleado);
                    this._wizard.discardProgress(pasoTipoEmpleado);
                    pasoTipoEmpleado.setValidated(false);
                }
                this.model.setProperty("/TipoEmpleado", "");
                this.model.setProperty("/NombreEmpleado", "");
                this.model.setProperty("/ApellidosEmpleado", "");
                this.model.setProperty("/DNIEmpleado", "");
                this.model.setProperty("/CIFEmpleado", "");
                this.model.setProperty("/SalarioMin", 0);
                this.model.setProperty("/SalarioMax", 0);
                this.model.setProperty("/SalarioBruto", 0);
                this.model.setProperty("/FechaIncorporacion", new Date());
                this.model.setProperty("/Comentario", "");

            }
        });
    });