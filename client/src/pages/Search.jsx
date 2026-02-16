import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { CircularProgress } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { getAllProducts, getFavourite } from "../api";
import ProductCard from "../components/cards/ProductCard";
import { useDispatch } from "react-redux";
import { openSnackbar } from "../redux/reducers/snackbarSlice";

const Container = styled.div`
  padding: 20px 30px;
  padding-bottom: 200px;
  height: 100%;
  overflow-y: scroll;
  display: flex;
  flex-direction: column;
  gap: 22px;
  @media (max-width: 768px) {
    padding: 20px 12px;
  }
  background: ${({ theme }) => theme.bg};
`;

const Header = styled.div`
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Title = styled.div`
  font-size: 28px;
  font-weight: 600;
  color: ${({ theme }) => theme.text_primary};
`;

const Subtitle = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.text_secondary + 90};
`;

const SearchRow = styled.form`
  width: 100%;
  display: flex;
  gap: 10px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.text_secondary + 40};
  background: ${({ theme }) => theme.card_light};
  color: ${({ theme }) => theme.text_primary};
  outline: none;
`;

const Button = styled.button`
  padding: 12px 14px;
  border-radius: 12px;
  border: none;
  background: ${({ theme }) => theme.primary};
  color: white;
  cursor: pointer;
  font-weight: 600;
`;

const Results = styled.div`
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
`;

const CardWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  justify-content: center;
  @media (max-width: 750px) {
    gap: 14px;
  }
`;

const Empty = styled.div`
  padding: 30px 10px;
  text-align: center;
  color: ${({ theme }) => theme.text_secondary + 90};
`;

const Search = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";

  const [query, setQuery] = useState(q);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [favouriteIds, setFavouriteIds] = useState([]);

  const effectiveQuery = useMemo(() => q.trim(), [q]);

  useEffect(() => {
    setQuery(q);
  }, [q]);

  useEffect(() => {
    const token = localStorage.getItem("krist-app-token");
    if (!token) return setFavouriteIds([]);
    getFavourite(token)
      .then((res) => setFavouriteIds((res.data || []).map((p) => p._id)))
      .catch(() => setFavouriteIds([]));
  }, []);

  useEffect(() => {
    if (!effectiveQuery) {
      setProducts([]);
      return;
    }

    setLoading(true);
    getAllProducts(`search=${encodeURIComponent(effectiveQuery)}`)
      .then((res) => {
        setProducts(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setProducts([]);
        setLoading(false);
        dispatch(
          openSnackbar({
            message: err?.response?.data?.message || err.message,
            severity: "error",
          })
        );
      });
  }, [dispatch, effectiveQuery]);

  const onSubmit = (e) => {
    e.preventDefault();
    const next = query.trim();
    setSearchParams(next ? { q: next } : {});
  };

  return (
    <Container>
      <Header>
        <Title>Search</Title>
        <Subtitle>Find products by name or description.</Subtitle>
        <SearchRow onSubmit={onSubmit}>
          <Input
            value={query}
            placeholder="Try: hoodie, shoes, bag..."
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit">Search</Button>
        </SearchRow>
      </Header>

      <Results>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </div>
        ) : effectiveQuery && products.length === 0 ? (
          <Empty>No results for “{effectiveQuery}”.</Empty>
        ) : (
          <CardWrapper>
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                favouriteIds={favouriteIds}
                onFavouriteChange={(isFav, id) => {
                  setFavouriteIds((prev) => {
                    if (isFav) return prev.includes(id) ? prev : [...prev, id];
                    return prev.filter((x) => x !== id);
                  });
                }}
              />
            ))}
          </CardWrapper>
        )}
      </Results>
    </Container>
  );
};

export default Search;

