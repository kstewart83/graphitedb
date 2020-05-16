import * as path from 'path';

import IExistingSample from './IExistingSample';
import GraphiteDB from '..';
import SampleLoader from './SampleLoader';

export class Northwind implements IExistingSample {

    static create():void {
        SampleLoader.createDbFromExisting(
            new Northwind(),
            path.join(__dirname, "..", "..", "data", "original", "sqlite", "northwind_small.sqlite"),
            path.join(__dirname, "..", "..", "data", "formatted", "sqlite", "northwind_small.gdb")
        );
    }

    static load():GraphiteDB {
        return new GraphiteDB(
            path.join(__dirname, "..", "..", "data", "formatted", "sqlite", "northwind_small.gdb")
        ).cloneToMemory();
    }

    getBasicMap(): any {
        return {
            Employee: {
                "LastName": ":employee/last-name",
                "FirstName": ":employee/first-name",
                "Title": ":employee/title",
                "TitleOfCourtesy": ":employee/title-of-courtesy",
                "BirthDate": ":employee/birth-date",
                "HireDate": ":employee/hire-date",
                "Address": ":employee/address",
                "City": ":employee/city",
                "PostalCode": ":employee/postal-code",
                "Country": ":employee/country",
                "HomePhone": ":employee/home-phone",
                "Extension": ":employee/extension",
                "Notes": ":employee/notes"
            },
            Customer: {
                "Id": ":customer/id",
                "CompanyName": ":customer/company-name",
                "ContactName": ":customer/contact-name",
                "ContactTitle": ":customer/contact-title",
                "Address": ":customer/address",
                "City": ":customer/city",
                "Region": ":customer/region",
                "PostalCode": ":customer/postal-code",
                "Country": ":customer/country",
                "Phone": ":customer/phone",
                "Fax": ":customer/fax"
            },
            Territory: {
                "Id": ":territory/id",
                "TerritoryDescription": ":territory/description"
            },
            Order: {
                "Id": ":order/id",
                "OrderDate": ":order/order-date",
                "RequiredDate": ":order/required-date",
                "ShippedDate": ":order/shipped-date",
                "Freight": ":order/freight",
                "ShipName": ":order/ship-name",
                "ShipAddress": ":order/ship-address",
                "ShipCity": ":order/ship-city",
                "ShipRegion": ":order/ship-region",
                "ShipPostalCode": ":order/ship-postal-code",
                "ShipCountry": ":order/ship-country"
            },
            OrderDetail: {
                "Id": ":order.detail/id",
                "UnitPrice": ":order.detail/unit-price",
                "Quantity": ":order.detail/quantity",
                "Discount": ":order.detail/discount"
            },
            Product: {
                "ProductName": ":product/name",
                "QuantityPerUnit": ":product/quantity-per-unit",
                "UnitPrice": ":product/unit-price",
                "UnitsInStock": ":product/units-in-stock",
                "UnitsOnOrder": ":product/units-on-order",
                "ReorderLevel": ":product/reorder-level",
                "Discontinued": ":product/discontinued"
            },
            Region: {
                "RegionDescription": ":region/description"
            },
            Supplier: {
                "CompanyName": ":supplier/company-name",
                "ContactName": ":supplier/contact-name",
                "ContactTitle": ":supplier/contact-title",
                "Address": ":supplier/address",
                "City": ":supplier/city",
                "Region": ":supplier/region",
                "PostalCode": ":supplier/postal-code",
                "Country": ":supplier/country",
                "Phone": ":supplier/phone",
                "Fax": ":supplier/fax",
                "HomePage": ":supplier/home-page"
            },
            Shipper: {
                "CompanyName": ":shipper/company-name",
                "Phone": ":shipper/phone-number"
            },
            Category: {
                "CategoryName": ":category/name",
                "Description": ":category/description"
            }
        };
    }

    getAlternateKeys(): any {
        return {
            Customer: ["Id"],
            Employee: ["LastName", "FirstName", "BirthDate"],
            Territory: ["Id"],
            Region: ["RegionDescription"],
            Order: ["Id"],
            OrderDetail: ["Id"],
            Product: ["ProductName"],
            Supplier: ["CompanyName"],
            Shipper: ["CompanyName"],
            Category: ["CategoryName"],
        };
    }

    getReferences(): any {
        return [
            {
                src: {table: "Territory", column: "RegionId"},
                tgt: {table: "Region", column: "Id"},
                attr: ":territory/region"
            },
            {
                src: {table: "Employee", column: "ReportsTo"},
                tgt: {table: "Employee", column: "Id"},
                attr: ":employee/reports-to"
            },
            {
                src: {table: "Product", column: "SupplierId"},
                tgt: {table: "Supplier", column: "Id"},
                attr: ":product/supplier"
            },
            {
                src: {table: "Product", column: "CategoryId"},
                tgt: {table: "Category", column: "Id"},
                attr: ":product/category"
            },
            {
                src: {table: "Order", column: "CustomerId"},
                tgt: {table: "Customer", column: "Id"},
                attr: ":order/customer"
            },
            {
                src: {table: "Order", column: "EmployeeId"},
                tgt: {table: "Employee", column: "Id"},
                attr: ":order/employee"
            },
            {
                src: {table: "Order", column: "ShipVia"},
                tgt: {table: "Shipper", column: "Id"},
                attr: ":order/ship-via"
            },
            {
                src: {table: "OrderDetail", column: "OrderId"},
                tgt: {table: "Order", column: "Id"},
                attr: ":order.detail/id"
            },
            {
                src: {table: "OrderDetail", column: "ProductId"},
                tgt: {table: "Product", column: "Id"},
                attr: ":order.detail/product"
            },
        ];    
    }

    getLinks(): any {
        return [
            {
                table: "EmployeeTerritory",
                tgts: [
                    {table: "Employee", column: {src: "EmployeeId", tgt: "Id"}},
                    {table: "Territory", column: {src: "TerritoryId", tgt: "Id"}}
                ],
                attr: ":employee/territory"
            }
        ];
    }
}