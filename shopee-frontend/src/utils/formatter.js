const formatCurrency = (amount, currencySymbol = '$') => {
    return `${currencySymbol}${parseFloat(amount).toFixed(2)}`;
};

const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

const formatProductName = (name) => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

export { formatCurrency, formatDate, formatProductName };