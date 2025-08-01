import axios from 'axios';
import { socket } from '../../socket';
import { useEffect, useState } from 'react';
import { useAuthContext } from '../../hooks/useAuthContext';
import Header from './Header';
import './KitchenMasterApp.css';
import OrdersBoard from './OrdersBoard';

const KitchenMaster = () => {
  const { user } = useAuthContext();
  const [orders, setOrders] = useState([]);

  const sortOrder = {
    placed: 1,
    preparing: 2,
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`http://localhost:4000/api/${user.RID}/orders`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const filtered = response.data.filter(order =>
        order.status === 'placed' || order.status === 'preparing'
      );

      const sorted = filtered.sort(
        (a, b) => sortOrder[a.status] - sortOrder[b.status]
      );

      setOrders(sorted);
    } catch (err) {
      console.error('Error fetching orders:', err);
      alert('Failed to load orders from server.');
    }
  };

  useEffect(() => {
    fetchOrders();
    
    const handleNewOrder = (order) => {
    if (order.status === 'placed' || order.status === 'preparing') {
      setOrders((prev) => {
        const exists = prev.some(o => o.tableNo === order.tableNo);
        return exists ? prev : [...prev, order].sort((a, b) => sortOrder[a.status] - sortOrder[b.status]);
      });
    }
  };

  socket.on("new-order", handleNewOrder);

  return () => {
    socket.off("new-order", handleNewOrder);
  };
    
  }, []);

  const updateStatus = async (tableNo, newStatus) => {
    try {
      await axios.patch(
        `http://localhost:4000/api/${user.RID}/orders/edit/${tableNo}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      setOrders(prev =>
        prev
          .map(order =>
            order.tableNo === tableNo ? { ...order, status: newStatus } : order
          )
          .filter(order => newStatus !== 'prepared')
      );
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Failed to update order status');
    }
  };

  return (
    <>
      <Header />
      <main className="main-content">
        <OrdersBoard orders={orders} updateStatus={updateStatus} />
      </main>
    </>
  );
};

export default KitchenMaster;
