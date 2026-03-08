// Separate PrintableChallan component for secure printing
import { type DeliveryItem } from "../../Context/Invoicing/DeliveryChallanContext";

interface PrintableChallanProps {
  challan: {
    challanId: string;
    deliveryDate: string;
    poNo: string;
    poDate: string;
    partyName: string;
    partyAddress: string;
    contactPerson?: string;
    partyPhone?: string;
    other?: string;
    vehicleNo?: string;
    deliveredBy?: string;
    driverCellNo?: string;
  };
  items: DeliveryItem[];
  brand: "chemtronics" | "hydroworx";
}

export function PrintableChallan({
  challan,
  items,
  brand,
}: PrintableChallanProps) {
  const logoSrc =
    brand === "chemtronics" ? "/CmLogo.png" : "/HydroworxLogo.png";
  const primaryColor = brand === "chemtronics" ? "#819E00" : "#0066CC";
  const secondaryColor = brand === "chemtronics" ? "#0A6802" : "#004499";

  return (
    <div
      className="printable-challan"
      style={{
        fontFamily: "Arial, sans-serif",
        background: "#fff",
        padding: "18px 20px",
        width: "100%",
        maxWidth: "190mm",
        margin: "0 auto",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <img src={logoSrc} alt="Logo" style={{ height: 60 }} />
        <h2
          style={{
            color: primaryColor,
            margin: "8px 0",
            fontSize: 28,
            fontWeight: "bold",
            letterSpacing: 2,
          }}
        >
          Delivery Challan
        </h2>
      </div>

      {/* Original/Duplicate/Triplicate */}
      <div style={{ position: "absolute", top: 20, right: 20 }}>
        <table style={{ border: "1px solid #222", fontSize: 11 }}>
          <tbody>
            <tr>
              <td style={{ border: "1px solid #222", padding: "2px 8px" }}>
                Original
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #222", padding: "2px 8px" }}>
                Duplicate
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #222", padding: "2px 8px" }}>
                Triplicate
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Party Info */}
      <table
        style={{
          width: "100%",
          fontSize: 12,
          marginBottom: 16,
          tableLayout: "fixed",
        }}
      >
        <tbody>
          <tr>
            <td
              style={{
                color: secondaryColor,
                fontWeight: "bold",
                width: 120,
                paddingBottom: 6,
              }}
            >
              Party Name
            </td>
            <td
              style={{
                color: "#222",
                fontWeight: "bold",
                paddingBottom: 6,
                wordBreak: "break-word",
              }}
            >
              {challan.partyName}
            </td>
            <td
              style={{
                color: secondaryColor,
                fontWeight: "bold",
                width: 120,
                paddingBottom: 6,
              }}
            >
              Delivery Date
            </td>
            <td style={{ color: "#222", paddingBottom: 6 }}>
              {challan.deliveryDate}
            </td>
          </tr>
          <tr>
            <td
              style={{
                color: secondaryColor,
                fontWeight: "bold",
                paddingBottom: 6,
              }}
            >
              Party Address
            </td>
            <td
              style={{
                color: "#222",
                paddingBottom: 6,
                wordBreak: "break-word",
              }}
            >
              {challan.partyAddress}
            </td>
            <td
              style={{
                color: secondaryColor,
                fontWeight: "bold",
                paddingBottom: 6,
              }}
            >
              DC No#
            </td>
            <td style={{ color: "#222", paddingBottom: 6 }}>
              {challan.challanId}
            </td>
          </tr>
          <tr>
            <td
              style={{
                color: secondaryColor,
                fontWeight: "bold",
                paddingBottom: 6,
              }}
            >
              PO No#
            </td>
            <td style={{ color: "#222", paddingBottom: 6 }}>{challan.poNo}</td>
            <td
              style={{
                color: secondaryColor,
                fontWeight: "bold",
                paddingBottom: 6,
              }}
            >
              PO Date
            </td>
            <td style={{ color: "#222", paddingBottom: 6 }}>
              {challan.poDate}
            </td>
          </tr>
          <tr>
            <td
              style={{
                color: secondaryColor,
                fontWeight: "bold",
                paddingBottom: 6,
              }}
            >
              Contact Person
            </td>
            <td style={{ color: "#222", paddingBottom: 6 }}>
              {challan.contactPerson || "-"}
            </td>
            <td
              style={{
                color: secondaryColor,
                fontWeight: "bold",
                paddingBottom: 6,
              }}
            >
              Party Phone #
            </td>
            <td style={{ color: "#222", paddingBottom: 6 }}>
              {challan.partyPhone || "-"}
            </td>
          </tr>
          <tr>
            <td
              style={{
                color: secondaryColor,
                fontWeight: "bold",
                paddingBottom: 6,
              }}
            >
              Other
            </td>
            <td style={{ color: "#222", paddingBottom: 6 }}>
              {challan.other || "-"}
            </td>
            <td></td>
            <td></td>
          </tr>
        </tbody>
      </table>

      {/* Vehicle/Delivery Info */}
      <table
        style={{
          width: "100%",
          fontSize: 12,
          marginBottom: 16,
          tableLayout: "fixed",
        }}
      >
        <tbody>
          <tr>
            <td style={{ width: "33%", paddingBottom: 6 }}>
              <span style={{ color: secondaryColor, fontWeight: "bold" }}>
                Vehicle No.
              </span>{" "}
              <span
                style={{
                  borderBottom: "1px solid #222",
                  minWidth: 48,
                  display: "inline-block",
                  marginLeft: 8,
                }}
              >
                {challan.vehicleNo || ""}
              </span>
            </td>
            <td style={{ width: "33%", paddingBottom: 6 }}>
              <span style={{ color: secondaryColor, fontWeight: "bold" }}>
                Delivered By
              </span>{" "}
              <span
                style={{
                  borderBottom: "1px solid #222",
                  minWidth: 48,
                  display: "inline-block",
                  marginLeft: 8,
                }}
              >
                {challan.deliveredBy || ""}
              </span>
            </td>
            <td style={{ width: "33%", paddingBottom: 6 }}>
              <span style={{ color: secondaryColor, fontWeight: "bold" }}>
                Driver Cell No.
              </span>{" "}
              <span
                style={{
                  borderBottom: "1px solid #222",
                  minWidth: 48,
                  display: "inline-block",
                  marginLeft: 8,
                }}
              >
                {challan.driverCellNo || ""}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Items Table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 11,
          marginBottom: 24,
          tableLayout: "fixed",
        }}
      >
        <thead>
          <tr style={{ background: "#F8FFF6" }}>
            <th style={{ border: "1px solid #222", padding: 4, width: "7%" }}>
              SR.
            </th>
            <th style={{ border: "1px solid #222", padding: 4, width: "18%" }}>
              Item Code
            </th>
            <th
              style={{
                border: "1px solid #222",
                padding: 4,
                width: "33%",
                overflowWrap: "anywhere",
              }}
            >
              Particulars
            </th>
            <th style={{ border: "1px solid #222", padding: 4, width: "10%" }}>
              Unit
            </th>
            <th style={{ border: "1px solid #222", padding: 4, width: "10%" }}>
              Length
            </th>
            <th style={{ border: "1px solid #222", padding: 4, width: "10%" }}>
              Width
            </th>
            <th style={{ border: "1px solid #222", padding: 4, width: "12%" }}>
              Qty
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td
                style={{
                  border: "1px solid #222",
                  padding: 4,
                  textAlign: "center",
                  overflowWrap: "anywhere",
                }}
              >
                {item.sr}
              </td>
              <td
                style={{
                  border: "1px solid #222",
                  padding: 4,
                  overflowWrap: "anywhere",
                }}
              >
                {item.itemCode}
              </td>
              <td
                style={{
                  border: "1px solid #222",
                  padding: 4,
                  overflowWrap: "anywhere",
                }}
              >
                {item.particulars}
              </td>
              <td
                style={{
                  border: "1px solid #222",
                  padding: 4,
                  overflowWrap: "anywhere",
                }}
              >
                {item.unit}
              </td>
              <td
                style={{
                  border: "1px solid #222",
                  padding: 4,
                  overflowWrap: "anywhere",
                }}
              >
                {item.length}
              </td>
              <td
                style={{
                  border: "1px solid #222",
                  padding: 4,
                  overflowWrap: "anywhere",
                }}
              >
                {item.width}
              </td>
              <td
                style={{
                  border: "1px solid #222",
                  padding: 4,
                  overflowWrap: "anywhere",
                }}
              >
                {item.qty}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer Signatures */}
      <div style={{ marginTop: 24 }}>
        <table
          style={{
            width: "100%",
            fontSize: 12,
            marginBottom: 16,
            tableLayout: "fixed",
          }}
        >
          <tbody>
            <tr>
              <td
                style={{
                  width: "33%",
                  textAlign: "center",
                  paddingBottom: 12,
                }}
              >
                <span
                  style={{
                    color: secondaryColor,
                    fontWeight: "bold",
                    borderBottom: "1px solid #222",
                    paddingBottom: 2,
                  }}
                >
                  Prepared By
                </span>
              </td>
              <td
                style={{
                  width: "33%",
                  textAlign: "center",
                  paddingBottom: 12,
                }}
              >
                <span
                  style={{
                    color: secondaryColor,
                    fontWeight: "bold",
                    borderBottom: "1px solid #222",
                    paddingBottom: 2,
                  }}
                >
                  Checked By
                </span>
              </td>
              <td
                style={{
                  width: "33%",
                  textAlign: "center",
                  paddingBottom: 12,
                }}
              >
                <span
                  style={{
                    color: secondaryColor,
                    fontWeight: "bold",
                    borderBottom: "1px solid #222",
                    paddingBottom: 2,
                  }}
                >
                  Manager
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <div style={{ margin: "16px 0", fontSize: 11 }}>
          Please receive the above material and return duplicate of this challan
          duly received and signed for record
        </div>
        <div
          style={{
            textAlign: "right",
            fontWeight: "bold",
            color: secondaryColor,
            fontSize: 12,
            marginTop: 16,
            borderBottom: "1px solid #222",
            paddingBottom: 2,
          }}
        >
          Receiver Signature
        </div>
      </div>

      {/* Footer Banner */}
      <div
        style={{
          width: "100%",
          marginTop: 24,
          background: "#eaf6ff",
          borderTop: `2px solid ${primaryColor}`,
          padding: "8px 0 8px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 16,
            fontSize: 10,
            color: "#222",
            padding: "8px 10px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 90, fontWeight: "bold" }}>Expertise</div>
          <div>
            <strong>HEAD OFFICE:</strong> 45-B, PECHS, 42-Faced Canal View
            Phase-II, Multan &nbsp; Tel: 922-345129-271-3
          </div>
          <div>
            <strong>MULTAN:</strong> S-6, Rawat Plaza, Main Model Town, Tel:
            051-609-1611
          </div>
          <div>
            <strong>RAWALPINDI:</strong> S-6, Rawat Plaza, Main Model Town, Tel:
            051-609-1611
          </div>
          <div>
            <strong>FAISALABAD:</strong> Filter Colony, Sargodha Road, Tel:
            0345-862-2246
          </div>
          <div>
            <strong>KARACHI:</strong> E-86, Ground Floor, Block 2, Tel:
            021-3375-0175
          </div>
        </div>
      </div>
    </div>
  );
}
