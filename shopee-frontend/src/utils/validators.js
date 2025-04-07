const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};

const validatePassword = (password) => {
    return password.length >= 6;
};

const validateProductSearch = (searchTerm) => {
    return searchTerm.trim().length > 0;
};

const validateFilterValues = (minSales, maxCommission) => {
    return (
        (minSales === '' || !isNaN(minSales)) &&
        (maxCommission === '' || !isNaN(maxCommission)) &&
        (minSales === '' || maxCommission === '' || parseFloat(minSales) <= parseFloat(maxCommission))
    );
};

export { validateEmail, validatePassword, validateProductSearch, validateFilterValues };