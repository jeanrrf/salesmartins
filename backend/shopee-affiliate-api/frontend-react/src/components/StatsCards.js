import React from 'react';

const StatsCards = ({ stats }) => {
  return (
    <div>
      <h3>Stats</h3>
      <p>Total Products: {stats.totalProducts}</p>
      <p>Total Categories: {stats.totalCategories}</p>
      <p>Average Discount: {stats.averageDiscount}%</p>
      <p>Top Commission: {stats.topCommission}%</p>
    </div>
  );
};

export default StatsCards;