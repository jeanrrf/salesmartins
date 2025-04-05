export type Product = {
    id: string;
    name: string;
    description: string;
    price: number;
    createdAt: Date;
    updatedAt: Date;
};

export type User = {
    id: string;
    username: string;
    email: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
};

export type Order = {
    id: string;
    userId: string;
    productId: string;
    quantity: number;
    totalPrice: number;
    createdAt: Date;
    updatedAt: Date;
};