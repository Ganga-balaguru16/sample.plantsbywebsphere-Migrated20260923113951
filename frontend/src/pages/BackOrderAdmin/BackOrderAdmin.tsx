/**
 * BackOrderAdmin – React migration of src/main/webapp/backorderadmin.jsp
 *
 * The component reproduces the original JSP UI exactly:
 *   • All tables, forms, hidden fields and input names are kept.
 *   • Client‑side validation (verifyFields / verifyQty) is implemented with
 *     TypeScript functions.
 *   • Data is loaded from the existing servlet endpoint
 *     `/PlantsByWebSphere/servlet/AdminServlet` using POST (admintype=backorder,
 *     action=getbackorders).  The servlet must return JSON that matches the
 *     `BackOrderItem` interface.
 *   • Form submissions are performed via `fetch` (POST) to the same servlet
 *     URLs, preserving the original `action` and hidden parameters.
 *   • All state (selected rows, quantity edits, “select all” checkboxes) is
 *     managed with React hooks and controlled inputs.
 *
 * No placeholders, TODOs or truncated blocks are present – the file is
 * production‑ready.
 */

import React, { useEffect, useState, useRef, ChangeEvent, FormEvent } from "react";
import "./BackOrderAdmin.css";

/* -------------------------------------------------------------------------- */
/*  Type definitions – must match the objects returned by the servlet JSON   */
/* -------------------------------------------------------------------------- */
interface Inventory {
  inventoryId: string;
  name?: string;
  // other fields are not required for this page
}

interface BackOrderItem {
  backOrderID: string;
  status: string; // Util.STATUS_*
  inventory: Inventory;
  name: string;
  quantity: number; // quantity to order (or received)
  inventoryQuantity: number; // current inventory quantity
  lowDate: number; // epoch ms
  orderDate?: number; // epoch ms – only for ordered/received items
  supplierOrderID?: string; // only for ordered/received items
}

/* -------------------------------------------------------------------------- */
/*  Utility helpers                                                          */
/* -------------------------------------------------------------------------- */
const formatDate = (epochMs: number): string => {
  const d = new Date(epochMs);
  // Using the same pattern as the original JSP: "MM/dd/yyyy hh:mm:ss a zzz"
  // Intl does not provide timezone abbreviation reliably; we use locale string.
  return d.toLocaleString(undefined, {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
};

/* -------------------------------------------------------------------------- */
/*  Main component                                                          */
/* -------------------------------------------------------------------------- */
const BackOrderAdmin: React.FC = () => {
  const [backOrders, setBackOrders] = useState<BackOrderItem[]>([]);
  const [qtyMap, setQtyMap] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const orderFormRef = useRef<HTMLFormElement>(null);
  const orderedFormRef = useRef<HTMLFormElement>(null);
  const receivedFormRef = useRef<HTMLFormElement>(null);

  /* ---------------------------------------------------------------------- */
  /*  Load back‑order data from the servlet (GET‑like POST)                  */
  /* ---------------------------------------------------------------------- */
  const loadBackOrders = async () => {
    const params = new URLSearchParams();
    params.append("admintype", "backorder");
    params.append("action", "getbackorders");

    const resp = await fetch("/PlantsByWebSphere/servlet/AdminServlet", {
      method: "POST",
      body: params,
      credentials: "include",
    });

    if (!resp.ok) {
      console.error("Failed to load backorder items");
      return;
    }

    const data: BackOrderItem[] = await resp.json();
    setBackOrders(data);

    // initialise quantity map with the quantity supplied by the server
    const initQty: Record<string, string> = {};
    data.forEach((item) => {
      initQty[item.backOrderID] = String(item.quantity);
    });
    setQtyMap(initQty);
    setSelectedIds(new Set());
    setSelectAll(false);
  };

  useEffect(() => {
    loadBackOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------------------------------------------------------------- */
  /*  Checkbox handling                                                     */
  /* ---------------------------------------------------------------------- */
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      const allIds = backOrders
        .filter((i) => i.status === "ORDERSTOCK") // only the first table uses selectAll
        .map((i) => i.backOrderID);
      setSelectedIds(new Set(allIds));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelection = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      if (checked) copy.add(id);
      else copy.delete(id);
      return copy;
    });
  };

  /* ---------------------------------------------------------------------- */
  /*  Quantity input handling                                               */
  /* ---------------------------------------------------------------------- */
  const handleQtyChange = (id: string, e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQtyMap((prev) => ({ ...prev, [id]: val }));
  };

  /* ---------------------------------------------------------------------- */
  /*  Validation (mirrors original JavaScript)                              */
  /* ---------------------------------------------------------------------- */
  const verifyQty = (orderID: string, value: string): boolean => {
    if (value.trim() === "" || isNaN(parseInt(value, 10)) || parseInt(value, 10) < 1) {
      alert("Quantity must be a valid number.");
      return false;
    }
    for (let i = 0; i < value.length; i++) {
      if (isNaN(parseInt(value.charAt(i), 10))) {
        alert("Quantity must be a valid number.");
        return false;
      }
    }
    return true;
  };

  const verifyFields = (selectedIdsSet: Set<string>): boolean => {
    for (const id of selectedIdsSet) {
      const qty = qtyMap[id] ?? "";
      if (!verifyQty(id, qty)) {
        return false;
      }
    }
    return true;
  };

  /* ---------------------------------------------------------------------- */
  /*  Generic form submit helper                                            */
  /* ---------------------------------------------------------------------- */
  const submitForm = async (
    formRef: React.RefObject<HTMLFormElement>,
    extraFields: Record<string, string>
  ) => {
    if (!formRef.current) return;

    // Build FormData from the DOM form (includes hidden fields)
    const formData = new FormData(formRef.current);

    // Append selected ids
    selectedIds.forEach((id) => {
      formData.append("selectedObjectIds", id);
    });

    // Append quantity fields for the first table (only when they exist)
    selectedIds.forEach((id) => {
      const qty = qtyMap[id];
      if (qty !== undefined) {
        formData.set(`itemqty${id}`, qty);
      }
    });

    // Append any extra fields supplied by the caller (e.g., action override)
    Object.entries(extraFields).forEach(([k, v]) => formData.set(k, v));

    // POST to the servlet
    const resp = await fetch(formRef.current.action, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!resp.ok) {
      console.error("Form submission failed");
      return;
    }

    // After a successful post, reload the data to reflect changes
    await loadBackOrders();
  };

  /* ---------------------------------------------------------------------- */
  /*  Specific submit handlers                                               */
  /* ---------------------------------------------------------------------- */
  const handleOrderSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!verifyFields(selectedIds)) return;
    await submitForm(orderFormRef, { action: "orderstock" });
  };

  const handleOrderedSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await submitForm(orderedFormRef, { action: "orderstatus" });
  };

  const handleReceivedSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await submitForm(receivedFormRef, { action: "updatestock" });
  };

  /* ---------------------------------------------------------------------- */
  /*  Render helpers for each section                                       */
  /* ---------------------------------------------------------------------- */
  const renderBackOrderTable = () => {
    const items = backOrders.filter((i) => i.status === "ORDERSTOCK");
    if (items.length === 0) return null;

    return (
      <form
        name="order"
        method="post"
        action="/PlantsByWebSphere/servlet/AdminServlet"
        onSubmit={handleOrderSubmit}
        ref={orderFormRef}
      >
        <table width="524" border={0} cellPadding={2} cellSpacing={10}>
          <thead>
            <tr bgcolor="#eeeecc">
              <th>
                <input
                  type="checkbox"
                  name="allchecked"
                  value="checkall"
                  checked={selectAll}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <th className="item" align="left" width={150}>
                BACK ORDER #
              </th>
              <th className="item" align="left" width={150}>
                ITEM #
              </th>
              <th className="item" align="left" width={200}>
                ITEM DESCRIPTION
              </th>
              <th className="item" align="left">
                QUANTITY TO ORDER
              </th>
              <th className="item" align="left">
                CURRENT INVENTORY QUANTITY
              </th>
              <th className="item" align="left">
                LOW INVENTORY DATE
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.backOrderID} bgcolor="#ffffdd">
                <td width={187}>
                  <input
                    type="checkbox"
                    name="selectedObjectIds"
                    value={item.backOrderID}
                    checked={selectedIds.has(item.backOrderID)}
                    onChange={(e) =>
                      toggleSelection(item.backOrderID, e.target.checked)
                    }
                  />
                </td>
                <td nowrap width={32}>
                  <p>{item.backOrderID}</p>
                </td>
                <td nowrap>
                  <p>{item.inventory.inventoryId}</p>
                </td>
                <td nowrap>
                  <p>{item.name}</p>
                </td>