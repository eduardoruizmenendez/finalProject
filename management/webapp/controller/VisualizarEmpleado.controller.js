// @ts-nocheck
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
],

    /**
     * 
     * @param {typeof sap.ui.core.mvc.Controller} Controller 
     * @param {typeof sap.ui.core.routing.History} History 
     * @param {typeof sap.m.MessageToast} MessageToast 
     * @param {typeof sap.ui.model.Filter} Filter
     * @param {typeof sap.ui.model.FilterOperator} FilterOperator
     */

    function (Controller, History, MessageToast, Filter, FilterOperator) {
        "use strict";

        function onInit() {
            this._split = this.byId("split");
            this._sapId = this.getOwnerComponent().sapId;
        };

        function onBeforeRendering(){
            this._i18n = this.getView().getModel("i18n").getResourceBundle();
        };

        //**************************
        // Manejadores de eventos
        //**************************
        function onVolver() {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("RouteMain", {}, true);
        };

        function onBuscarEmpleado(oEvent) {

            //Filtro sobre el apellido del empleado
            const arrayFilter = [];
            const sQuery = oEvent.oSource.getValue();

            //Construcción del filtro
            if(sQuery){
                arrayFilter.push( new Filter("LastName", FilterOperator.Contains, sQuery));
            };

            const oList = this.getView().byId("listaEmpleados");
            const oBinding = oList.getBinding("items");
            //Se aplica el filtro
            oBinding.filter(arrayFilter);
        };

        function onVisualizarEmpleado(oEvent) {
            //Creamos la página con el detalle del empleado
            this._split.to(this.createId("datosEmpleado"));
            //Obtenemos el empleado sobre el que se ha lanzado el evento a partir de la lista
            let context = oEvent.getParameter("listItem").getBindingContext("oData");
            //Guardamos el EmployeeId para usarlo fácilmente en varios puntos del proceso
            this._employeeId = context.getProperty("EmployeeId");
            let datosEmpleado = this.byId("datosEmpleado");
            //Vinculamos los datos del modelo oData para el empleado
            datosEmpleado.bindElement("oData>/Users(EmployeeId='" + this._employeeId + "',SapId='" + this._sapId + "')");

        };

        function onAscender(oEvent) {
            //Controlamos el diálogo modal con una parámetro _dialogoAscenso
            //Chequeo para instanciarlo sólo una vez
            if (!this._dialogoAscenso) {
                //Se instancia
                this._dialogoAscenso = sap.ui.xmlfragment("emp_mgmt/management/fragment/AscensoEmpleado", this);
                this.getView().addDependent(this._dialogoAscenso);
            }
            //Se asigna un nuevo modelo que tendrá las características necesarias para la entidad /Salaries
            this._dialogoAscenso.setModel(new sap.ui.model.json.JSONModel({}), "ascenso");
            //Se abre la ventana
            this._dialogoAscenso.open();
        };

        function onCancelarAscenso() {
            this._cerrarVentanaAscenso();
        };

        function onAceptarAscenso(oEvent) {
            //Obtenemos los datos del modelo asignado en onAscender
            var datosAscenso = this._dialogoAscenso.getModel("ascenso").getData();
            //Datos que vamos a enviar a /Salaries
            var body = {
                Ammount: datosAscenso.Ammount,
                CreationDate: datosAscenso.CreationDate,
                Comments: datosAscenso.Comments,
                SapId: this._sapId,
                EmployeeId: this._employeeId
            };
            //CREATE /Salaries
            this.getView().getModel("oData").create("/Salaries", body, {
                success: function () {
                    MessageToast.show(this._i18n.getText("ascensoOK"));
                    this.getView().getModel("oData").refresh();
                    //Cerrar la ventana de ascenso
                    this._cerrarVentanaAscenso();
                }.bind(this),
                error: function (e) {
                    MessageToast.show(this._i18n.getText("ascensoKO"));
                    console.error(e);
                }.bind(this)
            });

        };

        function onCambioAnexos(oEvent) {
            //Al haber un cambio en los anexos creamos el token de seguridad que necesitamos para comunicar con SAP
            var oUploadCollection = oEvent.getSource();
            // Header Token
            var oCustomerHeaderToken = new sap.m.UploadCollectionParameter("", {
                name: "x-csrf-token",
                value: this.getView().getModel("oData").getSecurityToken()
            });
            oUploadCollection.addHeaderParameter(oCustomerHeaderToken);
        }

        function onPreparacionCarga(oEvent) {
            //Se debe crear el parámetro slug antes de realizar la carga del fichero
            let oHeaderSlug = new sap.m.UploadCollectionParameter("", {
                name: "slug",
                value: this._sapId + ";" + this._employeeId + ";" + oEvent.getParameter("fileName")
            });
            oEvent.getParameters().addHeaderParameter(oHeaderSlug);
        }

        function onCargaFicheroFinalizada(oEvent) {
            //Refrescamos la visualización del UploadCollection
            var oUploadCollection = oEvent.getSource();
            oUploadCollection.getBinding("items").refresh();
        }

        function onBorrarFichero(oEvent) {
            //Eliminar un fichero del UploadCollection
            var oUploadCollection = oEvent.getSource();
            var sPath = oEvent.getParameter("item").getBindingContext("oData").getPath();
            //REMOVE
            this.getView().getModel("oData").remove(sPath, {
                success: function () {
                    oUploadCollection.getBinding("items").refresh();
                },
                error: function (e) {
                    console.error(e);
                }
            });
        };

        function descargaFichero(oEvent) {
            //Abrimos el documento en una nueva ventana para poder descargarlo
            var sPath = oEvent.getSource().getBindingContext("oData").getPath();
            window.open("/sap/opu/odata/sap/ZEMPLOYEES_SRV" + sPath + "/$value");
        };

        function onDarDeBaja(oEvent) {
            //Confirmación para borrar
            sap.m.MessageBox.confirm(this._i18n.getText("confirmacionDarDeBaja"), {
                title: this._i18n.getText("confirmar"),
                onClose: function (oAction) {
                    if (oAction === "OK") {
                        //REMOVE /Users
                        this.getView().getModel("oData").remove("/Users(EmployeeId='" + this._employeeId + "',SapId='" + this._sapId + "')", {
                            success: function (data) {
                                //Muestro mensaje de éxito
                                MessageToast.show(this._i18n.getText("empleadoEliminado"));
                                //Refresco la lista
                                this.getView().byId("listaEmpleados").getBinding("items").refresh();
                                //Vacio la ventana de detalle
                                this._split.to(this.createId("seleccioneEmpleado"));
                            }.bind(this),
                            error: function (e) {
                                console.error(e);
                            }.bind(this)
                        });
                    }
                }.bind(this)
            });
        };

        //**************************
        // Funciones internas
        //**************************

        function _cerrarVentanaAscenso(){
            this._dialogoAscenso.close();
        };

        //**************************
        // Prototipado
        //**************************

        return Controller.extend("emp_mgmt.management.controller.VisualizarEmpleado", {
            onInit: onInit,
            onBeforeRendering: onBeforeRendering,
            onVolver: onVolver,
            onBuscarEmpleado: onBuscarEmpleado,
            onVisualizarEmpleado: onVisualizarEmpleado,
            onDarDeBaja: onDarDeBaja,
            onAscender: onAscender,
            onCancelarAscenso: onCancelarAscenso,
            onAceptarAscenso: onAceptarAscenso,
            onCambioAnexos: onCambioAnexos,
            onPreparacionCarga: onPreparacionCarga,
            onCargaFicheroFinalizada: onCargaFicheroFinalizada,
            onBorrarFichero: onBorrarFichero,
            _cerrarVentanaAscenso: _cerrarVentanaAscenso
        });

    });