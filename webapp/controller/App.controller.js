sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/resource/ResourceModel",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/core/Core",
  "sap/ui/core/library",
  "sap/ui/unified/library",
  "sap/ui/unified/DateTypeRange",
  "sap/ui/core/date/UI5Date",
  "sap/ui/core/ValueState",
  "sap/m/MessageBox",
  "sap/ui/core/BusyIndicator"
], function (
  Controller,
  MessageToast,
  JSONModel,
  ResourceModel,
  Filter,
  FilterOperator,
  Core,
  CoreLibrary,
  UnifiedLibrary,
  DateTypeRange,
  UI5Date,
  ValueState,
  MessageBox,
  BusyIndicator
) {
  "use strict";
  return Controller.extend("sap.ui.demo.walkthrough.controller.App", {
    onInit: function () {
      // Load customer data from a JSON file
      fetch("data/customer.json")
        .then((response) => response.json())
        .then((res) => {
          var oData = {
            customer_data: res,
            customer_detail: res[0],
            category: [
              {
                id: "GOLD",
                desc: "GOLD",
              },
              {
                id: "PLATINUM",
                desc: "PLATINUM",
              },
              {
                id: "SILVER",
                desc: "SILVER",
              },
            ],
            payment_status: [
              {
                id: "SUCCESS",
                desc: "SUCCESS",
              },
              {
                id: "IN PROCESS",
                desc: "IN PROCESS",
              },
              {
                id: "FAILED",
                desc: "FAILED",
              },
            ],
          };
          var oModel = new JSONModel(oData);
          this.getView().setModel(oModel);

          // Load internationalization (i18n) model
          var i18nModel = new ResourceModel({
            bundleName: "sap.ui.demo.walkthrough.i18n.i18n",
          });
          this.getView().setModel(i18nModel, "cust_model");
        })
        .catch((err) => console.log(err));

      // Create a JSON model for datepicker
      var oModel = new JSONModel();
      oModel.setData({
        valueDP2: UI5Date.getInstance(2014, 2, 26),
      });
      this.getView().setModel(oModel);

      // Attach event handlers for validation and parsing errors
      Core.attachParseError(function (oEvent) {
        var oElement = oEvent.getParameter("element");
        if (oElement.setValueState) {
          oElement.setValueState(ValueState.Error);
        }
      });

      Core.attachValidationSuccess(function (oEvent) {
        var oElement = oEvent.getParameter("element");
        if (oElement.setValueState) {
          oElement.setValueState(ValueState.None);
        }
      });
    },

    // Formatter for category color
    colorFormatter: function (category) {
      switch (category) {
        case "GOLD":
          return "#FFD700";
        case "PLATINUM":
          return "#E5E4E2";
        case "SILVER":
          return "#808080";
        default:
          return "#808080";
      }
    },

    // Formatter for payment status text
    paymentStatusTextFormatter: function (payment_status) {
      switch (payment_status) {
        case "SUCCESS":
          return "Confirmed";
        case "FAILED":
          return "Failed";
        case "IN PROCESS":
          return "In Process";
        default:
          return "";
      }
    },

    // Formatter for payment status color
    paymentStatusColorFormatter: function (payment_status) {
      switch (payment_status) {
        case "SUCCESS":
          return "Success";
        case "FAILED":
          return "Error";
        case "IN PROCESS":
          return "Warning";
        default:
          return "";
      }
    },

    // Search function
    onSearch: function (oEvent) {
      var sQuery = oEvent.getParameter("newValue");
      var sSelectedKey = this.getView()
        .byId("searchDropdown")
        .getSelectedKey();

      var oList = this.getView().byId("searchResultList");
      var oBinding = oList.getBinding("items");

      var oFilter;
      if (sQuery) {
        if (sSelectedKey === "name") {
          oFilter = new Filter("name", FilterOperator.Contains, sQuery);
        } else if (sSelectedKey === "category") {
          oFilter = new Filter("category", FilterOperator.Contains, sQuery);
        } else if (sSelectedKey === "payment_status") {
          oFilter = new Filter(
            "payment_status",
            FilterOperator.Contains,
            sQuery
          );
        }
      }
      oBinding.filter(oFilter);
    },

    // Create a new customer
    onCreateCustomer: function () {
      var oDialog = this.getView().byId("addCustomerDialog");
      var oNewCustomer = oDialog
        .getModel("dialogModel")
        .getProperty("/newCustomer");
      oDialog.close();
    },

    // Close the dialog
    onDialogClose: function () {
      var oDialog = this.getView().byId("addCustomerDialog");
      oDialog.close();
    },

    // Open the customer creation dialog
    onOpenDialog: function () {
      if (!this.oDialog) {
        this.oDialog = this.loadFragment({
          name: "sap.ui.demo.walkthrough.fragments.AddCustomer",
        });
      }
      this.oDialog.then(function (oDialog) {
        oDialog.open();
      });
    },

    // Handle item press event (e.g., when clicking on a customer)
    onListItemPress: function (oEvent) {
      var oCusomerData = this.getView()
        .getModel()
        .getProperty("/customer_data");
      var oPaymentStatus = this.getView()
        .getModel()
        .getProperty("/payment_status");
      var oCategory = this.getView().getModel().getProperty("/category");

      var oCustomerDetail = oEvent
        .getSource()
        .getBindingContext()
        .getObject();

      this.getView().getModel().setData({
        customer_data: oCusomerData,
        customer_detail: oCustomerDetail,
        payment_status: oPaymentStatus,
        category: oCategory,
      });
    },

    // Get values for creating a new customer
    onGetValuesPress: function () {
      var oCusomerData = this.getView()
        .getModel()
        .getProperty("/customer_data");

      // Calculate the new customer ID
      var oIdSeries = oCusomerData.map((item) =>
        parseInt(item.id.substring(4))
      );
      var oId = Math.max(...oIdSeries) + 1;

      // Define fields to validate
      const oFields = {
        name: "name",
        email: "email",
        dob: "dob",
      };

      var oValid = {};

      // Validate each field
      for (const [key, value] of Object.entries(oFields)) {
        var _oTemp = {
          [key]:
            this.getView().byId(value).mProperties.valueState === "Error" ||
            this.getView().byId(value).mProperties.value === ""
              ? false
              : true,
        };
        Object.assign(oValid, _oTemp);
      }

      // Create a new customer if all fields are valid
      if (oValid.name && oValid.email && oValid.dob) {
        var oFormData = {
          id: "CUST" + oId,
          name: this.getView().byId("name").mProperties.value,
          email: this.getView().byId("email").mProperties.value,
          phone_number: this.getView().byId("phone_number").mProperties.value,
          address: this.getView().byId("address").mProperties.value,
          dob: this.getView().byId("dob").mProperties.value,
          category: this.getView().byId("category").mProperties.selectedKey,
          payment_status:
            this.getView().byId("payment_status").mProperties.selectedKey,
        };

        oCusomerData.push(oFormData);

        var oCustomerDetail = this.getView()
          .getModel()
          .getProperty("/customer_detail");

        var oPaymentStatus = this.getView()
          .getModel()
          .getProperty("/payment_status");

        var oCategory = this.getView().getModel().getProperty("/category");

        this.getView().getModel().setData({
          customer_data: oCusomerData,
          customer_detail: oCustomerDetail,
          payment_status: oPaymentStatus,
          category: oCategory,
        });

        var oDialog = this.getView().byId("addCustomerDialog");
        this.showBusyIndicator(3000);
        oDialog.close();
      } else {
        MessageBox.error("Please enter valid data!!");
        for (const [key, value] of Object.entries(oFields)) {
          this.getView().byId(value).setValueState(ValueState.Error);
        }
      }
    },

    // Show a busy indicator with optional duration and delay
    showBusyIndicator: function (iDuration, iDelay) {
      BusyIndicator.show(iDelay);

      if (iDuration && iDuration > 0) {
        if (this._sTimeoutId) {
          clearTimeout(this._sTimeoutId);
          this._sTimeoutId = null;
        }

        this._sTimeoutId = setTimeout(function () {
          this.hideBusyIndicator();
        }.bind(this), iDuration);
      }
    },

    // Hide the busy indicator
    hideBusyIndicator: function () {
      BusyIndicator.hide();
    },

    // Handle name field change event
    handleNameChange: function (oEvent) {
      var _name = oEvent.mParameters.value;
      var oDP = oEvent.getSource();

      if (_name === "" || _name === undefined) {
        oDP.setValueState(ValueState.Error);
      } else {
        oDP.setValueState(ValueState.None);
      }
    },

    // Handle email field change event
    handleEmailChange: function (oEvent) {
      var oDP = oEvent.getSource();
      var _mail = oEvent.getParameters().value;

      var mailregex = /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/;

      if (mailregex.test(_mail)) {
        oDP.setValueState(ValueState.None);
      } else {
        oDP.setValueState(ValueState.Error);
      }
    },

    // Handle date field change event
    handleDateChange: function (oEvent) {
      var oDP = oEvent.getSource();
      var bValid = oEvent.getParameters().valid;

      if (bValid) {
        oDP.setValueState(ValueState.None);
      } else {
        oDP.setValueState(ValueState.Error);
      }
    },
  });
});
