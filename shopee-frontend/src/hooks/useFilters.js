import { useState } from 'react';

const useFilters = () => {
    const [filters, setFilters] = useState({
        minSales: '',
        maxCommission: '',
        similarityThreshold: 50,
    });

    const updateFilter = (name, value) => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            [name]: value,
        }));
    };

    const resetFilters = () => {
        setFilters({
            minSales: '',
            maxCommission: '',
            similarityThreshold: 50,
        });
    };

    return {
        filters,
        updateFilter,
        resetFilters,
    };
};

export default useFilters;