import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { CircularProgress } from "@mui/material";
import { getOrders } from "../api";
import { useDispatch } from "react-redux";
import { openSnackbar } from "../redux/reducers/snackbarSlice";
import { useNavigate } from "react-router-dom";

const Container = styled.div`
  padding: 20px 30px;
  padding-bottom: 200px;
  height: 100%;
  overflow-y: scroll;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 18px;
  @media (max-width: 768px) {
    padding: 20px 12px;
  }
  background: ${({ theme }) => theme.bg};
`;

const Section = styled.div`
  width: 100%;
  max-width: 900px;
  padding: 32px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const Title = styled.div`
  font-size: 28px;
  font-weight: 600;
  color: ${({ theme }) => theme.text_primary};
`;

const OrderCard = styled.div`
  border: 1px solid ${({ theme }) => theme.text_secondary + 40};
  background: ${({ theme }) => theme.card_light};
  border-radius: 14px;
  padding: 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  color: ${({ theme }) => theme.text_primary};
`;

const Label = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.text_secondary + 90};
`;

const Value = styled.div`
  font-size: 14px;
  font-weight: 600;
`;

const Items = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Item = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  cursor: pointer;
`;

const Img = styled.img`
  width: 44px;
  height: 44px;
  border-radius: 10px;
  object-fit: cover;
`;

const ItemText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ItemTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
`;

const ItemMeta = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.text_secondary + 90};
`;

const Empty = styled.div`
  padding: 30px 10px;
  text-align: center;
  color: ${({ theme }) => theme.text_secondary + 90};
`;

const parseDecimal = (value) => {
  if (value == null) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (value?.$numberDecimal) return Number(value.$numberDecimal);
  return null;
};

const Orders = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("krist-app-token");
    if (!token) {
      setOrders([]);
      return;
    }

    setLoading(true);
    getOrders(token)
      .then((res) => {
        setOrders(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setOrders([]);
        setLoading(false);
        dispatch(
          openSnackbar({
            message: err?.response?.data?.message || err.message,
            severity: "error",
          })
        );
      });
  }, [dispatch]);

  return (
    <Container>
      <Section>
        <Title>Your orders</Title>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </div>
        ) : orders.length === 0 ? (
          <Empty>No orders yet.</Empty>
        ) : (
          orders.map((order) => {
            const total = parseDecimal(order.total_amount);
            const createdAt = order.createdAt
              ? new Date(order.createdAt).toLocaleString()
              : "";
            return (
              <OrderCard key={order._id}>
                <Row>
                  <div>
                    <Label>Status</Label>
                    <Value>{order.status || "—"}</Value>
                  </div>
                  <div>
                    <Label>Total</Label>
                    <Value>{total != null ? `$${total.toFixed(2)}` : "—"}</Value>
                  </div>
                  <div>
                    <Label>Placed</Label>
                    <Value>{createdAt || "—"}</Value>
                  </div>
                </Row>

                <Items>
                  {(order.products || []).slice(0, 3).map((p, idx) => {
                    const prod = p.product || {};
                    return (
                      <Item
                        key={`${order._id}-${idx}`}
                        onClick={() => prod._id && navigate(`/shop/${prod._id}`)}
                      >
                        <Img src={prod.img} alt={prod.title || "Product"} />
                        <ItemText>
                          <ItemTitle>{prod.title || "Product"}</ItemTitle>
                          <ItemMeta>
                            Qty: {p.quantity} • ${prod?.price?.org ?? 0}
                          </ItemMeta>
                        </ItemText>
                      </Item>
                    );
                  })}
                </Items>
              </OrderCard>
            );
          })
        )}
      </Section>
    </Container>
  );
};

export default Orders;

