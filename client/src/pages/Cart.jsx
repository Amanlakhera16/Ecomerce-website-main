import React, { useEffect, useState } from "react";
import styled from "styled-components";
import TextInput from "../components/TextInput";
import Button from "../components/Button";
import { addToCart, deleteFromCart, getCart, placeOrder } from "../api";
import { useNavigate } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import { useDispatch } from "react-redux";
import { openSnackbar } from "../redux/reducers/snackbarSlice";
import { DeleteOutline } from "@mui/icons-material";

const Container = styled.div`
  padding: 20px 30px;
  padding-bottom: 200px;
  height: 100%;
  overflow-y: scroll;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 30px;
  @media (max-width: 768px) {
    padding: 20px 12px;
  }
  background: ${({ theme }) => theme.bg};
`;
const Section = styled.div`
  width: 100%;
  max-width: 1400px;
  padding: 32px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 22px;
  gap: 28px;
`;
const Title = styled.div`
  font-size: 28px;
  font-weight: 500;
  display: flex;
  justify-content: ${({ center }) => (center ? "center" : "space-between")};
  align-items: center;
`;

const Wrapper = styled.div`
  display: flex;
  gap: 32px;
  width: 100%;
  padding: 12px;
  @media (max-width: 750px) {
    flex-direction: column;
  }
`;
const Left = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  @media (max-width: 750px) {
    flex: 1.2;
  }
`;
const Table = styled.div`
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 30px;
  ${({ head }) => head && `margin-bottom: 22px`}
`;
const TableItem = styled.div`
  ${({ flex }) => flex && `flex: 1; `}
  ${({ bold }) =>
    bold &&
    `font-weight: 600; 
  font-size: 18px;`}
`;
const Counter = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  border: 1px solid ${({ theme }) => theme.text_secondary + 40};
  border-radius: 8px;
  padding: 4px 12px;
`;

const Product = styled.div`
  display: flex;
  gap: 16px;
`;
const Img = styled.img`
  height: 80px;
`;
const Details = styled.div``;
const Protitle = styled.div`
  color: ${({ theme }) => theme.primary};
  font-size: 16px;
  font-weight: 500;
`;
const ProDesc = styled.div`
  font-size: 14px;
  font-weight: 400;
  color: ${({ theme }) => theme.text_primary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
const ProSize = styled.div`
  font-size: 14px;
  font-weight: 500;
`;

const Right = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  @media (max-width: 750px) {
    flex: 0.8;
  }
`;
const Subtotal = styled.div`
  font-size: 22px;
  font-weight: 600;
  display: flex;
  justify-content: space-between;
`;
const Delivery = styled.div`
  font-size: 18px;
  font-weight: 500;
  display: flex;
  gap: 6px;
  flex-direction: column;
`;

const PaymentToggleRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const PaymentChip = styled.div`
  cursor: pointer;
  border: 1px solid ${({ theme }) => theme.text_secondary + 50};
  color: ${({ theme }) => theme.text_secondary + 90};
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 14px;
  width: fit-content;
  ${({ selected, theme }) =>
    selected &&
    `
  border: 1px solid ${theme.text_primary};
  color: ${theme.text_primary};
  background: ${theme.text_primary + 12};
  font-weight: 600;
  `}
`;

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [reload, setReload] = useState(false);
  const [products, setProducts] = useState([]);
  const [buttonLoad, setButtonLoad] = useState(false);

  const [deliveryDetails, setDeliveryDetails] = useState({
    firstName: "",
    lastName: "",
    emailAddress: "",
    phoneNumber: "",
    completeAddress: "",
  });

  const [paymentMode, setPaymentMode] = useState("card"); // "card" | "cod"
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
    holderName: "",
  });

  const getProducts = async () => {
    setLoading(true);
    const token = localStorage.getItem("krist-app-token");
    if (!token) {
      setProducts([]);
      setLoading(false);
      return;
    }
    await getCart(token)
      .then((res) => {
        setProducts(res.data);
        setLoading(false);
      })
      .catch(() => {
        setProducts([]);
        setLoading(false);
      });
  };

  const addCart = async (id) => {
    const token = localStorage.getItem("krist-app-token");
    if (!token) {
      return dispatch(
        openSnackbar({ message: "Please sign in to modify cart", severity: "info" })
      );
    }
    await addToCart(token, { productId: id, quantity: 1 })
      .then((res) => {
        setReload(!reload);
      })
      .catch((err) => {
        setReload(!reload);
        dispatch(
          openSnackbar({
            message: err.message,
            severity: "error",
          })
        );
      });
  };

  const removeCart = async (id, quantity, type) => {
    const token = localStorage.getItem("krist-app-token");
    if (!token) {
      return dispatch(
        openSnackbar({ message: "Please sign in to modify cart", severity: "info" })
      );
    }
    let qnt = quantity > 0 ? 1 : null;
    if (type === "full") qnt = null;
    await deleteFromCart(token, {
      productId: id,
      quantity: qnt,
    })
      .then((res) => {
        setReload(!reload);
      })
      .catch((err) => {
        setReload(!reload);
        dispatch(
          openSnackbar({
            message: err.message,
            severity: "error",
          })
        );
      });
  };

  const calculateSubtotal = () => {
    return products.reduce(
      (total, item) => total + item.quantity * item?.product?.price?.org,
      0
    );
  };

  useEffect(() => {
    getProducts();
  }, [reload]);

  const convertAddressToString = (addressObj) => {
    // Convert the address object to a string representation
    return `${addressObj.firstName} ${addressObj.lastName}, ${addressObj.completeAddress}, ${addressObj.phoneNumber}, ${addressObj.emailAddress}`;
  };

  const simulatePayment = async ({ amount, mode }) => {
    // Simulate a real payment gateway flow (no external calls).
    await new Promise((r) => setTimeout(r, 1400));
    if (amount <= 0) throw new Error("Invalid amount");
    if (mode === "card") {
      // Lightweight validation for UX realism.
      const card = cardDetails.cardNumber.replace(/\s+/g, "");
      if (card.length < 12) throw new Error("Invalid card number");
      if (!cardDetails.expiry) throw new Error("Invalid expiry date");
      if (String(cardDetails.cvv || "").length < 3) throw new Error("Invalid CVV");
      if (!cardDetails.holderName) throw new Error("Invalid card holder name");
    }
    return { status: "paid", provider: "simulated" };
  };

  const PlaceOrder = async () => {
    setButtonLoad(true);
    try {
      const token = localStorage.getItem("krist-app-token");
      if (!token) {
        dispatch(
          openSnackbar({
            message: "Please sign in to place an order.",
            severity: "info",
          })
        );
        return;
      }

      const isDeliveryDetailsFilled =
        deliveryDetails.firstName &&
        deliveryDetails.lastName &&
        deliveryDetails.completeAddress &&
        deliveryDetails.phoneNumber &&
        deliveryDetails.emailAddress;

      if (!isDeliveryDetailsFilled) {
        // Show an error message or handle the situation where delivery details are incomplete
        dispatch(
          openSnackbar({
            message: "Please fill in all required delivery details.",
            severity: "error",
          })
        );
        return;
      }

      if (!products || products.length === 0) {
        dispatch(
          openSnackbar({
            message: "Your cart is empty.",
            severity: "info",
          })
        );
        return;
      }

      const totalAmount = Number(calculateSubtotal().toFixed(2));

      dispatch(
        openSnackbar({
          message:
            paymentMode === "cod"
              ? "Confirming order (Cash on Delivery)..."
              : "Processing payment (simulated)...",
          severity: "info",
        })
      );

      if (paymentMode !== "cod") {
        await simulatePayment({ amount: totalAmount, mode: paymentMode });
      }

      const orderDetails = {
        products: products.map((item) => ({
          productId: item?.product?._id,
          quantity: item?.quantity,
        })),
        address: convertAddressToString(deliveryDetails),
        totalAmount,
        payment: { mode: paymentMode, simulated: true },
      };

      await placeOrder(token, orderDetails).catch((err) => {
        throw new Error(err?.response?.data?.message || "Failed to place order");
      });

      // Show success message or navigate to a success page
      dispatch(
        openSnackbar({
          message: "Order placed successfully",
          severity: "success",
        })
      );
      // Clear the cart and update the UI
      setReload(!reload);
    } catch (error) {
      // Handle errors, show error message, etc.
      dispatch(
        openSnackbar({
          message: error?.message || "Failed to place order. Please try again.",
          severity: "error",
        })
      );
    } finally {
      setButtonLoad(false);
    }
  };
  return (
    <Container>
      {loading ? (
        <CircularProgress />
      ) : (
        <Section>
          <Title>Your Shopping Cart</Title>
          {products.length === 0 ? (
            <>Cart is empty</>
          ) : (
            <Wrapper>
              <Left>
                <Table>
                  <TableItem bold flex>
                    Product
                  </TableItem>
                  <TableItem bold>Price</TableItem>
                  <TableItem bold>Quantity</TableItem>
                  <TableItem bold>Subtotal</TableItem>
                  <TableItem></TableItem>
                </Table>
                {products?.map((item) => (
                  <Table>
                    <TableItem flex>
                      <Product>
                        <Img src={item?.product?.img} />
                        <Details>
                          <Protitle>{item?.product?.title}</Protitle>
                          <ProDesc>{item?.product?.name}</ProDesc>
                          <ProSize>Size: Xl</ProSize>
                        </Details>
                      </Product>
                    </TableItem>
                    <TableItem>${item?.product?.price?.org}</TableItem>
                    <TableItem>
                      <Counter>
                        <div
                          style={{
                            cursor: "pointer",
                            flex: 1,
                          }}
                          onClick={() =>
                            removeCart(item?.product?._id, item?.quantity - 1)
                          }
                        >
                          -
                        </div>
                        {item?.quantity}
                        <div
                          style={{
                            cursor: "pointer",
                            flex: 1,
                          }}
                          onClick={() => addCart(item?.product?._id)}
                        >
                          +
                        </div>
                      </Counter>
                    </TableItem>
                    <TableItem>
                      {" "}
                      ${(item.quantity * item?.product?.price?.org).toFixed(2)}
                    </TableItem>
                    <TableItem>
                      <DeleteOutline
                        sx={{ color: "red" }}
                        onClick={() =>
                          removeCart(
                            item?.product?._id,
                            item?.quantity - 1,
                            "full"
                          )
                        }
                      />
                    </TableItem>
                  </Table>
                ))}
              </Left>
              <Right>
                <Subtotal>
                  Subtotal : ${calculateSubtotal().toFixed(2)}
                </Subtotal>
                <Delivery>
                  Delivery Details:
                  <div>
                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                      }}
                    >
                      <TextInput
                        small
                        placeholder="First Name"
                        value={deliveryDetails.firstName}
                        handelChange={(e) =>
                          setDeliveryDetails({
                            ...deliveryDetails,
                            firstName: e.target.value,
                          })
                        }
                      />
                      <TextInput
                        small
                        placeholder="Last Name"
                        value={deliveryDetails.lastName}
                        handelChange={(e) =>
                          setDeliveryDetails({
                            ...deliveryDetails,
                            lastName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <TextInput
                      small
                      value={deliveryDetails.emailAddress}
                      handelChange={(e) =>
                        setDeliveryDetails({
                          ...deliveryDetails,
                          emailAddress: e.target.value,
                        })
                      }
                      placeholder="Email Address"
                    />
                    <TextInput
                      small
                      value={deliveryDetails.phoneNumber}
                      handelChange={(e) =>
                        setDeliveryDetails({
                          ...deliveryDetails,
                          phoneNumber: e.target.value,
                        })
                      }
                      placeholder="Phone no. +91 XXXXX XXXXX"
                    />
                    <TextInput
                      small
                      textArea
                      rows="5"
                      handelChange={(e) =>
                        setDeliveryDetails({
                          ...deliveryDetails,
                          completeAddress: e.target.value,
                        })
                      }
                      value={deliveryDetails.completeAddress}
                      placeholder="Complete Address (Address, State, Country, Pincode)"
                    />
                  </div>
                </Delivery>
                <Delivery>
                  Payment Details (Simulated):
                  <div>
                    <PaymentToggleRow>
                      <PaymentChip
                        selected={paymentMode === "card"}
                        onClick={() => setPaymentMode("card")}
                      >
                        Card (Simulated)
                      </PaymentChip>
                      <PaymentChip
                        selected={paymentMode === "cod"}
                        onClick={() => setPaymentMode("cod")}
                      >
                        Cash on Delivery
                      </PaymentChip>
                    </PaymentToggleRow>

                    {paymentMode === "card" && (
                      <>
                        <TextInput
                          small
                          placeholder="Card Number"
                          value={cardDetails.cardNumber}
                          handelChange={(e) =>
                            setCardDetails({
                              ...cardDetails,
                              cardNumber: e.target.value,
                            })
                          }
                        />
                        <div
                          style={{
                            display: "flex",
                            gap: "6px",
                          }}
                        >
                          <TextInput
                            small
                            placeholder="Expiry Date (MM/YY)"
                            value={cardDetails.expiry}
                            handelChange={(e) =>
                              setCardDetails({
                                ...cardDetails,
                                expiry: e.target.value,
                              })
                            }
                          />
                          <TextInput
                            small
                            placeholder="CVV"
                            value={cardDetails.cvv}
                            handelChange={(e) =>
                              setCardDetails({
                                ...cardDetails,
                                cvv: e.target.value,
                              })
                            }
                          />
                        </div>
                        <TextInput
                          small
                          placeholder="Card Holder name"
                          value={cardDetails.holderName}
                          handelChange={(e) =>
                            setCardDetails({
                              ...cardDetails,
                              holderName: e.target.value,
                            })
                          }
                        />
                      </>
                    )}

                    {paymentMode === "cod" && (
                      <div style={{ fontSize: "14px", opacity: 0.9 }}>
                        You will pay at delivery. No payment information needed.
                      </div>
                    )}
                    <div
                      style={{
                        marginTop: "10px",
                        fontSize: "12px",
                        opacity: 0.85,
                      }}
                    >
                      Payments are simulated for now. Orders will still be created
                      and shown in your account.
                    </div>
                  </div>
                </Delivery>
                <Button
                  text={paymentMode === "cod" ? "Place Order" : "Pay & Place Order"}
                  small
                  isLoading={buttonLoad}
                  isDisabled={buttonLoad}
                  onClick={PlaceOrder}
                />
              </Right>
            </Wrapper>
          )}
        </Section>
      )}
    </Container>
  );
};

export default Cart;
