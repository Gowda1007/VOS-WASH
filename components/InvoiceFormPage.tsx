  import React, { useState, useEffect, useRef } from "react";
  import type {
    Invoice,
    CustomerType,
    Service,
    Customer,
    ServiceSets,
    ManageableService,
    PaymentMethod,
    PendingOrder,
    AppSettings,
    Payment,
    Language,
  } from "../types";
  import { Card, Button, Icon, Modal } from "./Common";
  import { InvoicePreview } from "./InvoicePreview";
  import { downloadPDF, generatePdfAsFile } from "../services/pdfService";
  import { useToast } from "../hooks/useToast";
  import { calculateRemainingBalance } from "../hooks/useInvoices";
  import { PhoneNumberInput } from "./PhoneNumberInput";
  import { useLanguage } from "../hooks/useLanguage";

  // Updated declare global for AndroidBridge - it will now be available on window
  // due to `addJavascriptInterface` in MainActivity.kt

  interface InvoiceFormPageProps {
    onSave: (
      invoiceData: Omit<Invoice, "invoiceNumber" | "invoiceDate">
    ) => Promise<Invoice>;
    onUpdatePayment: (
      invoiceNumber: string,
      amount: number,
      method: PaymentMethod,
      referenceNumber?: string
    ) => Promise<Invoice | null>;
    onComplete: () => void;
    existingInvoice: Invoice | null;
    customers: Customer[];
    serviceSets: ServiceSets;
    invoices: Invoice[];
    pendingOrder: PendingOrder | null;
    appSettings: AppSettings;
  }

  const customerTypes: CustomerType[] = [
    "customer",
    "garage_service_station",
    "dealer",
  ];

  const InvoiceLanguageToggle: React.FC<{
    value: Language;
    onChange: (lang: Language) => void;
  }> = ({ value, onChange }) => {
    const { t } = useLanguage();
    return (
      <div className="flex items-center justify-center p-1 bg-slate-200 dark:bg-slate-700 rounded-lg">
        <button
          onClick={() => onChange("en")}
          className={`px-4 py-1.5 text-sm rounded-md ${
            value === "en" ? "bg-white dark:bg-slate-800 shadow" : ""
          }`}
        >
          {t("english")}
        </button>
        <button
          onClick={() => onChange("kn")}
          className={`px-4 py-1.5 text-sm rounded-md ${
            value === "kn" ? "bg-white dark:bg-slate-800 shadow" : ""
          }`}
        >
          {t("kannada")}
        </button>
      </div>
    );
  };

  export const InvoiceFormPage: React.FC<InvoiceFormPageProps> = ({
    onSave,
    onUpdatePayment,
    onComplete,
    customers,
    serviceSets,
    invoices,
    pendingOrder,
    appSettings,
  }) => {
    const toast = useToast();
    const { t } = useLanguage();
    const [step, setStep] = useState(1);

    const [customer, setCustomer] = useState({
      name: "",
      phone: "",
      address: "",
    });
    const [customerType, setCustomerType] = useState<CustomerType>("customer");
    const [selectedServices, setSelectedServices] = useState<Service[]>([]);
    const [isCustomServiceModalOpen, setIsCustomServiceModalOpen] =
      useState(false);
    const [newCustomService, setNewCustomService] = useState({
      name: "",
      price: 0,
    });
    const [showOldBalance, setShowOldBalance] = useState(false);
    const [oldBalance, setOldBalance] = useState({ amount: 0, date: "" });
    const [showAdvancePaid, setShowAdvancePaid] = useState(false);
    const [advancePaid, setAdvancePaid] = useState({ amount: 0, date: "" });

    const [previewData, setPreviewData] = useState<Invoice | null>(null);
    const [invoiceLanguage, setInvoiceLanguage] = useState<Language>("en");

    const [savedInvoice, setSavedInvoice] = useState<Invoice | null>(null);
    const [paymentCollected, setPaymentCollected] = useState(false);
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
    const isSubmittingRef = useRef(false);
    const [nowPaid, setNowPaid] = useState({
      amount: 0,
      method: "cash" as PaymentMethod,
    });

    useEffect(() => {
      if (pendingOrder) {
        setCustomer({
          name: pendingOrder.customerName,
          phone: pendingOrder.customerPhone,
          address: pendingOrder.customerAddress,
        });
        setCustomerType(pendingOrder.customerType);
        setSelectedServices(pendingOrder.services);
        if (pendingOrder.advancePaid.amount > 0) {
          setShowAdvancePaid(true);
          setAdvancePaid({
            amount: pendingOrder.advancePaid.amount,
            date: pendingOrder.advancePaid.date || pendingOrder.orderDate,
          });
        }
      }
    }, [pendingOrder]);

    useEffect(() => {
      if (customer.phone.length === 10) {
        const existingCustomer = customers.find(
          (c: Customer) => c.phone === customer.phone
        );
        if (existingCustomer) {
          setCustomer({
            ...customer,
            name: existingCustomer.name,
            address: existingCustomer.address,
          });

          const totalArrears = invoices
            .filter((inv) => inv.customerPhone === customer.phone)
            .reduce((total, inv) => {
              const balance = calculateRemainingBalance(inv);
              return balance > 0 ? total + balance : total;
            }, 0);

          if (totalArrears > 0) {
            setShowOldBalance(true);
            setOldBalance({ amount: Math.round(totalArrears), date: "" });
          } else {
            setShowOldBalance(false);
            setOldBalance({ amount: 0, date: "" });
          }
        } else {
          setShowOldBalance(false);
          setOldBalance({ amount: 0, date: "" });
        }
      }
    }, [customer.phone, customers, invoices]);

    useEffect(() => {
      if (!pendingOrder) {
        setSelectedServices([]);
      }
    }, [customerType, pendingOrder]);

    const handleNext = () => {
      if (step === 1) {
        if (!customer.name || customer.phone.length !== 10) {
          toast.error(
            "Please provide a valid customer name and 10-digit phone number."
          );
          return;
        }
      }
      if (step === 2) {
        const finalServices = selectedServices.filter(
          (s) => s.name && s.price > 0 && s.quantity > 0
        );
        if (finalServices.length === 0) {
          toast.error(
            t(
              "add-at-least-one-service",
              "Please add at least one goods or service."
            )
          );
          return;
        }
      }
      setStep((prev) => prev + 1);
    };

    const handleBack = () => setStep((prev) => prev - 1);

    const handleGeneratePreview = () => {
      const finalServices = selectedServices.filter(
        (s) => s.name && s.price > 0 && s.quantity > 0
      );
      const invoiceForPreview: Omit<
        Invoice,
        "invoiceNumber" | "invoiceDate" | "payments"
      > & { payments: Payment[] } = {
        customerName: customer.name,
        customerPhone: customer.phone,
        customerAddress: customer.address || "N/A",
        customerType: customerType,
        services: finalServices,
        oldBalance:
          showOldBalance && oldBalance.amount > 0 ? oldBalance : undefined,
        advancePaid:
          showAdvancePaid && advancePaid.amount > 0 ? advancePaid : undefined,
        payments: [],
        language: invoiceLanguage,
      };
      setPreviewData({
        ...invoiceForPreview,
        invoiceNumber: "PREVIEW",
        invoiceDate: new Date().toLocaleDateString("en-IN"),
      });
      setStep(4);
    };

    const handleSaveAndProceed = async () => {
      if (!previewData) return;
      try {
        const saved = await onSave(previewData);
        setSavedInvoice(saved);
        setNowPaid({ ...nowPaid, amount: calculateRemainingBalance(saved) });
        setStep(5);
      } catch (error) {
        toast.error("Failed to save invoice.");
        console.log(error);
      }
    };

  const handleCollectPayment = async () => {
    if (isSubmittingRef.current || !savedInvoice) return;

    if (nowPaid.amount <= 0) {
      toast.error(t("enter-valid-amount", "Please enter a valid amount."));
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmittingPayment(true); // Keep state for button disabling/UI feedback
    
    try {
      const updatedInvoice = await onUpdatePayment(
        savedInvoice.invoiceNumber,
        nowPaid.amount,
        nowPaid.method
      );

      if (updatedInvoice) {
        setSavedInvoice(updatedInvoice);
        setPaymentCollected(true);
      } else {
        toast.error(t("payment-update-failed", "Failed to update payment."));
      }
    } catch (error) {
      console.error("[InvoiceFormPage] Error collecting payment:", error);
      toast.error(t("payment-error"));
    } finally {
      isSubmittingRef.current = false;
      setIsSubmittingPayment(false);
    }
  };

  const handleSkipPayment = () => {
    setPaymentCollected(true);
  };

    const handleServiceQuantityChange = (index: number, newQuantity: number) => {
      setSelectedServices((prev) => {
        const newServices = [...prev];
        if (newServices[index]) {
          newServices[index].quantity = Math.max(1, newQuantity);
        }
        return newServices;
      });
    };

    const handleAddCustomServiceFromModal = () => {
      if (!newCustomService.name || newCustomService.price <= 0) {
        toast.error(
          t(
            "valid-service-name-price",
            "Please enter a valid goods/service name and price."
          )
        );
        return;
      }
      const serviceToAdd: Service = {
        ...newCustomService,
        quantity: 1,
        isCustom: true,
      };
      setSelectedServices((prev) => [...prev, serviceToAdd]);
      setNewCustomService({ name: "", price: 0 });
      setIsCustomServiceModalOpen(false);
    };

    const handleSelectPredefinedService = (service: ManageableService) => {
      setSelectedServices((prev) => {
        if (prev.some((s) => s.name === service.name && !s.isCustom)) {
          return prev;
        }
        return [...prev, { ...service, quantity: 1, isCustom: false }];
      });
    };

    const handleRemoveService = (index: number) => {
      setSelectedServices((prev) => prev.filter((_, i) => i !== index));
    };

    const handleDownload = async (invoiceToDownload: Invoice) => {
      const elementToPrint = document.getElementById("invoice-preview-content");
      if (elementToPrint) {
        const pdfData = {
          invoiceNumber: invoiceToDownload.invoiceNumber,
          customerName: invoiceToDownload.customerName,
        };
        await downloadPDF(pdfData, elementToPrint);
        toast.success(t("export-success-message"));
      } else {
        toast.error("Could not find invoice content to download.");
      }
    };

    const blobToBase64 = (blob: Blob): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result?.toString().split(",")[1];
          if (base64String) {
            resolve(base64String);
          } else {
            reject(new Error("Failed to convert blob to base64"));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    };

    const handleShareWhatsApp = async () => {
      if (!savedInvoice) return;

      const elementToPrint = document.getElementById("invoice-preview-content");
      if (!elementToPrint) {
        toast.error("Could not find invoice content to share.");
        return;
      }

      const amountPaid = savedInvoice.payments.slice(-1)[0]?.amount || 0;
      const messageText = t("whatsapp-share-message")
        .replace("{customerName}", savedInvoice.customerName)
        .replace("{amountPaid}", amountPaid.toString())
        .replace("{invoiceNumber}", savedInvoice.invoiceNumber);

      const pdfData = {
        invoiceNumber: savedInvoice.invoiceNumber,
        customerName: savedInvoice.customerName,
      };
      const pdfFile = await generatePdfAsFile(pdfData, elementToPrint);
      if (!pdfFile) {
        toast.error("Failed to generate PDF file for sharing.");
        return;
      }

      // Check if the AndroidBridge is available (only in Android WebView)
      if (window.AndroidBridge?.sharePdfViaWhatsApp) {
        try {
          const base64Pdf = await blobToBase64(pdfFile);
          window.AndroidBridge.sharePdfViaWhatsApp(
            base64Pdf,
            pdfFile.name,
            messageText,
            // Ensure the phone number is clean and prefixed with country code if needed
            // For Indian numbers, '91' is the country code.
            `91${savedInvoice.customerPhone.replace(/\D/g, "")}`
          );
        } catch (error) {
          console.error("Error sharing via native bridge:", error);
          toast.error("Could not share via WhatsApp.");
        }
      } else if (navigator.share && navigator.canShare({ files: [pdfFile] })) {
        // Fallback for web browsers supporting Web Share API
        try {
          await navigator.share({
            files: [pdfFile],
            title: `VOS WASH Invoice #${savedInvoice.invoiceNumber}`,
            text: messageText,
          });
        } catch (error) {
          console.log("Share cancelled or failed", error);
          if (error instanceof DOMException && error.name === "AbortError") {
            // User dismissed the share dialog
          } else {
            toast.error("Web Share API failed. Attempting direct download.");
            await handleDownload(savedInvoice);
            const whatsappUrl = `https://wa.me/91${savedInvoice.customerPhone.replace(
              /\D/g,
              ""
            )}?text=${encodeURIComponent(messageText)}`;
            window.open(whatsappUrl, "_blank");
            toast.info(
              "Your file has been downloaded. Please attach it in the WhatsApp chat."
            );
          }
        }
      } else {
        // Fallback for browsers not supporting Web Share API
        await handleDownload(savedInvoice);
        const whatsappUrl = `https://wa.me/91${savedInvoice.customerPhone.replace(
          /\D/g,
          ""
        )}?text=${encodeURIComponent(messageText)}`;
        window.open(whatsappUrl, "_blank");
        toast.info(
          "Your file has been downloaded. Please attach it in the WhatsApp chat."
        );
      }
    };

    const renderStep1 = () => (
      <Card className="p-6 md:p-8">
        <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100 border-b pb-2 dark:border-slate-700">
          {t("customer-details")}
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Icon
                name="phone"
                className="w-4 h-4 text-indigo-600 dark:text-indigo-400"
              />
              {t("customer-phone")}
            </label>
            <PhoneNumberInput
              value={customer.phone}
              onChange={(phone) => setCustomer({ ...customer, phone })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Icon
                name="user"
                className="w-4 h-4 text-indigo-600 dark:text-indigo-400"
              />
              {t("customer-name")}
            </label>
            <input
              type="text"
              placeholder={t("customer-name")}
              value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Icon
                name="map-pin"
                className="w-4 h-4 text-indigo-600 dark:text-indigo-400"
              />
              {t("customer-address")}
            </label>
            <input
              type="text"
              placeholder={t("customer-address")}
              value={customer.address}
              onChange={(e) =>
                setCustomer({ ...customer, address: e.target.value })
              }
              className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t("customer-type")}
            </p>
            <div className="flex flex-wrap gap-4">
              {customerTypes.map((type) => (
                <label key={type} className="flex items-center">
                  <input
                    type="radio"
                    name="customerType"
                    value={type}
                    checked={customerType === type}
                    onChange={() => setCustomerType(type)}
                    className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:bg-slate-700 dark:border-slate-500"
                  />
                  {t(type)}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t pt-6 dark:border-slate-700 mt-6">
          <Button onClick={handleNext} className="w-full py-3!">
            {t("next")}
          </Button>
        </div>
      </Card>
    );

    const renderStep2 = () => {
      const availableServices =
        serviceSets[customerType]?.filter(
          (ps) =>
            !selectedServices.some((ss) => ss.name === ps.name && !ss.isCustom)
        ) || [];

      return (
        <Card className="p-6 md:p-8">
          <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100 border-b pb-2 dark:border-slate-700">
            {t("services-and-items")}
          </h3>
          <div className="space-y-3 mb-6">
            {selectedServices.length === 0 && (
              <p className="text-center text-slate-500 py-4">
                {t("no-services-added")}
              </p>
            )}
            {selectedServices.map((service, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 rounded-md bg-slate-50 dark:bg-slate-800/50"
              >
                <div className="grow">
                  <p className="font-semibold">{t(service.name)}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t("price-label")} ₹{service.price}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor={`qty-${index}`} className="text-sm font-medium">
                    {t("qty-label")}
                  </label>
                  <input
                    type="number"
                    id={`qty-${index}`}
                    value={service.quantity}
                    min="1"
                    onChange={(e) =>
                      handleServiceQuantityChange(
                        index,
                        parseInt(e.target.value, 10)
                      )
                    }
                    className="block w-20 px-3 py-2 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"
                  />
                </div>
                <button
                  onClick={() => handleRemoveService(index)}
                  className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full"
                  aria-label={t("delete-service-aria", "Delete goods/service")}
                >
                  <Icon name="trash" className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          <div className="border-t dark:border-slate-700 pt-4">
            <h4 className="font-semibold mb-2">{t("add-services")}</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {availableServices.map((service) => (
                <button
                  key={service.name}
                  onClick={() => handleSelectPredefinedService(service)}
                  className="px-3 py-1.5 text-sm bg-slate-200 dark:bg-slate-700 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                  title={`${t(service.name)} - ₹${service.price}`}
                >
                  {t(service.name)} (₹{service.price})
                </button>
              ))}
            </div>
            <Button
              onClick={() => setIsCustomServiceModalOpen(true)}
              variant="secondary"
              className="w-full"
            >
              <Icon name="plus" className="w-5 h-5" />
              {t("add-custom-service")}
            </Button>
          </div>

          <div className="flex justify-between gap-4 mt-6 border-t pt-6 dark:border-slate-700">
            <Button onClick={handleBack} variant="secondary">
              {t("back")}
            </Button>
            <Button onClick={handleNext}>{t("next")}</Button>
          </div>
        </Card>
      );
    };

    const renderStep3 = () => (
      <Card className="p-6 md:p-8">
        <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100 border-b pb-2 dark:border-slate-700">
          {t("financials")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border dark:border-slate-700">
            <label className="flex items-center font-medium mb-3">
              <input
                type="checkbox"
                checked={showOldBalance}
                onChange={(e) => setShowOldBalance(e.target.checked)}
                className="mr-2 h-4 w-4 rounded text-red-600 focus:ring-red-500"
              />{" "}
              {t("old-balance-arrears")}
            </label>
            {showOldBalance && (
              <div className="space-y-2">
                <input
                  type="number"
                  value={oldBalance.amount || ""}
                  onChange={(e) =>
                    setOldBalance({
                      ...oldBalance,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder={t("amount-placeholder")}
                  className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"
                />
                <input
                  type="date"
                  value={oldBalance.date}
                  onChange={(e) =>
                    setOldBalance({ ...oldBalance, date: e.target.value })
                  }
                  className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"
                />
              </div>
            )}
          </div>
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border dark:border-slate-700">
            <label className="flex items-center font-medium mb-3">
              <input
                type="checkbox"
                checked={showAdvancePaid}
                onChange={(e) => setShowAdvancePaid(e.target.checked)}
                className="mr-2 h-4 w-4 rounded text-green-600 focus:ring-green-500"
              />{" "}
              {t("advance-paid")}
            </label>
            {showAdvancePaid && (
              <div className="space-y-2">
                <input
                  type="number"
                  value={advancePaid.amount || ""}
                  onChange={(e) =>
                    setAdvancePaid({
                      ...advancePaid,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder={t("amount-placeholder")}
                  className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"
                />
                <input
                  type="date"
                  value={advancePaid.date}
                  onChange={(e) =>
                    setAdvancePaid({ ...advancePaid, date: e.target.value })
                  }
                  className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-between gap-4 mt-6 border-t pt-6 dark:border-slate-700">
          <Button onClick={handleBack} variant="secondary">
            {t("back")}
          </Button>
          <Button onClick={handleGeneratePreview}>{t("preview-invoice")}</Button>
        </div>
      </Card>
    );

    const renderStep4 = () => (
      <div>
        <div className="flex justify-center mb-4">
          <InvoiceLanguageToggle
            value={invoiceLanguage}
            onChange={setInvoiceLanguage}
          />
        </div>
        <div className="p-4 sm:p-8 bg-slate-200 dark:bg-slate-800 rounded-lg">
          {previewData && (
            <InvoicePreview
              invoiceData={previewData}
              language={invoiceLanguage}
            />
          )}
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
          <Button
            onClick={handleBack}
            variant="secondary"
            className="w-full sm:w-auto"
          >
            <Icon name="pencil" className="w-5 h-5" /> {t("edit-details")}
          </Button>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button onClick={handleSaveAndProceed} className="w-full">
              <Icon name="banknotes" className="w-5 h-5" />{" "}
              {t("save-and-continue")}
            </Button>
          </div>
        </div>
      </div>
    );

    const renderStep5 = () => {
      if (!savedInvoice) return null;

      const balanceDue = calculateRemainingBalance(savedInvoice);

      const generateQrCodeUrl = () => {
        if (!appSettings.upiId || !nowPaid.amount || nowPaid.amount <= 0)
          return null;
        const payeeName = "VOS WASH";
        const upiUrl = `upi://pay?pa=${appSettings.upiId}&pn=${encodeURIComponent(
          payeeName
        )}&am=${nowPaid.amount}&cu=INR`;
        return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
          upiUrl
        )}`;
      };

      const qrCodeUrl = generateQrCodeUrl();

      const paymentMethods: PaymentMethod[] = ["cash", "upi"];

      return (
        <Card className="p-6 md:p-8">
          <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100 border-b pb-2 dark:border-slate-700">
            {paymentCollected ? t("actions") : t("collect-payment")}
          </h3>
          <div className="text-center mb-4">
            <p className="text-slate-500">
              {t("invoice-for")
                .replace("{invoiceNumber}", savedInvoice.invoiceNumber)
                .replace("{customerName}", savedInvoice.customerName)}
            </p>
            <p className="text-3xl font-bold">
              {t("balance-due-label")} ₹{Math.max(0, balanceDue).toFixed(2)}
            </p>
          </div>

          {!paymentCollected ? (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="confirmAmountInput"
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  {t("enter-amount")}
                </label>
                <input
                  type="number"
                  id="confirmAmountInput"
                  value={nowPaid.amount || ""}
                  onChange={(e) =>
                    setNowPaid((p) => ({
                      ...p,
                      amount: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"
                />
              </div>
              <div>
                <label
                  htmlFor="paymentMethod"
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  {t("payment-method")}
                </label>
                <div className="relative">
                  <div className="flex gap-4 mt-2">
                    {paymentMethods.map((method) => (
                      <label key={method} className="flex items-center">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method}
                          checked={nowPaid.method === method}
                          onChange={() =>
                            setNowPaid((p) => ({
                              ...p,
                              method: method,
                            }))
                          }
                          className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:bg-slate-700 dark:border-slate-500"
                        />
                        {t(method)}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              {nowPaid.method === "upi" && (
                <div className="mt-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-700 text-center">
                  {qrCodeUrl ? (
                    <>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        {t("scan-to-pay", "Scan to pay ₹{amount}").replace(
                          "{amount}",
                          nowPaid.amount.toString()
                        )}
                      </p>
                      <img
                        src={qrCodeUrl}
                        alt="UPI QR Code"
                        className="mx-auto rounded-lg w-48 h-48"
                      />
                      <p className="mt-2 font-semibold text-slate-800 dark:text-slate-200">
                        {appSettings.upiId}
                      </p>
                    </>
                  ) : (
                    <p className="text-slate-500 h-60 flex items-center justify-center">
                      {t("enter-valid-amount-qr")}
                    </p>
                  )}
                </div>
              )}
              <div className="flex justify-between gap-4 mt-6 border-t pt-6 dark:border-slate-700">
                <Button
                  onClick={handleSkipPayment}
                  variant="secondary"
                  className="w-1/2"
                >
                  {t("skip-payment", "Skip Payment")}
                </Button>
                <Button
                  onClick={handleCollectPayment}
                  disabled={isSubmittingPayment}
                  className="bg-green-600 hover:bg-green-700 w-1/2"
                >
                  {isSubmittingPayment
                    ? t("processing")
                    : t("confirm-collection")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4 mt-6 border-t pt-6 dark:border-slate-700">
              <div className="p-4 sm:p-8 bg-slate-200 dark:bg-slate-800 rounded-lg hidden">
                <InvoicePreview
                  invoiceData={savedInvoice}
                  language={savedInvoice.language}
                />
              </div>
              <p className="text-green-600 font-semibold">
                {t("payment-recorded-successfully")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => handleDownload(savedInvoice)}
                  variant="secondary"
                >
                  <Icon name="document-duplicate" className="w-5 h-5" />{" "}
                  {t("download-pdf")}
                </Button>
                <Button
                  onClick={handleShareWhatsApp}
                  className="bg-[#25D366]! hover:bg-[#128C7E]!"
                >
                  <Icon name="share" className="w-5 h-5 text-white" />{" "}
                  {t("share-on-whatsapp")}
                </Button>
              </div>
              <Button onClick={onComplete}>
                {t("finish-and-go-to-invoices")}
              </Button>
            </div>
          )}
        </Card>
      );
    };

    return (
      <div className="space-y-6">
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
          <div
            className="bg-indigo-600 h-2.5 rounded-full"
            style={{
              width: `${(step / 5) * 100}%`,
              transition: "width 0.3s ease-in-out",
            }}
          ></div>
        </div>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}

        <Modal
          isOpen={isCustomServiceModalOpen}
          onClose={() => setIsCustomServiceModalOpen(false)}
          title={t("add-custom-service")}
        >
          <div className="space-y-4">
            <input
              type="text"
              placeholder={t("service-name-placeholder", "Goods/Service Name")}
              value={newCustomService.name}
              onChange={(e) =>
                setNewCustomService((p) => ({ ...p, name: e.target.value }))
              }
              className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"
            />
            <input
              type="number"
              placeholder={t("price-placeholder")}
              value={newCustomService.price || ""}
              onChange={(e) =>
                setNewCustomService((p) => ({
                  ...p,
                  price: parseFloat(e.target.value) || 0,
                }))
              }
              className="block w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button
                onClick={() => setIsCustomServiceModalOpen(false)}
                variant="secondary"
              >
                {t("cancel")}
              </Button>
              <Button onClick={handleAddCustomServiceFromModal}>
                {t("add-services")}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  };
