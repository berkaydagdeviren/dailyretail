import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale, setDefaultLocale } from  "react-datepicker";
import { tr } from 'date-fns/locale/tr';
import moment from 'moment';
import './Dashboard.css';
import ExcelJS from 'exceljs';


registerLocale('tr', tr)
const flattenItems = (items) => {
    return items.flat(); // Flatten one level of nesting
  };
const Download = () => {
    const [dateRange, setDateRange] = useState([null, null]);
    const [startDate, endDate] = dateRange;
    const [sales, setSales] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [companiesWithDateSales, setCompaniesWithDateSales] = useState({});
    const [products, setProducts] = useState([]);
    useEffect(() => {
        fetchSales().catch(error => console.error("Fetching sales failed", error));
        const fetchCompaniesAndProducts = async () => {
            try {
              const companiesResponse = await axios.get('/api/companies');
              setCompanies(companiesResponse.data.map(company => ({ label: company.name, value: company._id })));
              const productsResponse = await axios.get('/api/products');
              setProducts(productsResponse.data.map(product => ({ label: product.name, value: product._id, price: product.price })));
            } catch (error) {
              console.error("Error fetching companies or products:", error.response ? error.response.data : error.message);
            }
          };
          fetchCompaniesAndProducts();
          
      }, []);
      const fetchProducts = async () => {
        try {
          const response = await fetch('http://localhost:3002/api/products');
          const products = await response.json();
          return products.reduce((acc, product) => {
            acc[product.name] = product.code;
            return acc;
          }, {});
        } catch (error) {
          console.error('Error fetching products:', error);
          return {};
        }
      };

      const downloadExcel = async (items, companyName, dateRange) => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sheet1');
      
        // Define the columns based on your table headers
        worksheet.columns = [
          { header: 'Kod(*)', key: 'code', width: 20 },
          { header: 'Miktar', key: 'quantity', width: 15 },
          { header: 'Mal Fazlası İsk.', key: 'extraDiscount', width: 20 },
          { header: 'Fiyat(*)', key: 'price', width: 15 },
          { header: 'İsk.1 Tip', key: 'discount1Type', width: 20 },
          { header: 'İsk.1', key: 'discount1', width: 15 },
          { header: 'İsk.2 Tip', key: 'discount2Type', width: 20 },
          { header: 'İsk.2', key: 'discount2', width: 15 },
          { header: 'KDV', key: 'vat', width: 15 },
          { header: 'Fiili Tarih', key: 'actualDate', width: 20 },
          { header: 'Fiyat Tipi', key: 'priceType', width: 20 },
        ];
      
        // Add rows from the items
        items.forEach(item => {
          worksheet.addRow({
            code: item.code,
            quantity: item.quantity,
            extraDiscount: '', // Adjust as necessary
            price: item.price,
            discount1Type: '', // Adjust as necessary
            discount1: '', // Adjust as necessary
            discount2Type: '', // Adjust as necessary
            discount2: '', // Adjust as necessary
            vat: '', // Adjust as necessary
            actualDate: '', // Adjust as necessary
            priceType: item.isDifferentPrice ? 2 : 1,
          });
        });
      
        // Create a buffer and write the workbook to it
        const buffer = await workbook.xlsx.writeBuffer();
      
        // Format the dates for the filename
        const formattedStartDate = moment(dateRange[0]).format('YYYY-MM-DD');
        const formattedEndDate = moment(dateRange[1]).format('YYYY-MM-DD');
      
        // Create a blob and download the file
        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${companyName}_${formattedStartDate}_to_${formattedEndDate}.xlsx`;
        link.click();
        URL.revokeObjectURL(link.href);
      };
      
      

      const handleCompaniesWithDateSales = async () => {
        const productCodes = await fetchProducts();
        //if (update[0] && update[1]){
        setCompaniesWithDateSales({})
            sales.map((sale, saleIndex) => (
            
                moment(dateRange[0]).format('MM-DD-YYYY') <= moment(sale.createdAt).format('MM-DD-YYYY') 
                && moment(dateRange[1]).format('MM-DD-YYYY') >= moment(sale.createdAt).format('MM-DD-YYYY') ?
                
                setCompaniesWithDateSales(prevState => {
                    const companyExists = prevState[sale.companyName.name] !== undefined;
                    const companyName = sale.companyName.name;
                    const itemsSoldWithCode = sale.itemsSold.map(item => ({
                      ...item,
                      code: productCodes[item.itemName] || 'Unknown' // Add the code from the fetched data
                    }));
                    if (companyExists) {
                      return {
                        ...prevState,
                        [sale.companyName.name]: {
                          items: [...prevState[sale.companyName.name].items, ...itemsSoldWithCode]
                        }
                      };
                    } else {
                      return {
                        ...prevState,
                        [sale.companyName.name]: {
                          items: itemsSoldWithCode
                        }
                      };
                    }
                  })
                
                  
                : null
               
            ))
        //}
      }
      const fetchSales = async () => {
        try {
          const response = await axios.get('/api/sales');
          setSales(response.data);
        } catch (error) {
          console.error("Failed to fetch sales:", error.response ? error.response.data : error.message);
        }
   
      };
    return (
        <div>
      <DatePicker
        selectsRange={true}
        startDate={startDate}
        endDate={endDate}
        onChange={(update) => {
            setDateRange(update);
        }}
        locale="tr"
        withPortal
        />
        
        {
            dateRange[0] && dateRange[1]  ? 
             
                //companies that have sale in between selected lines
                //handleCompaniesWithDateSales()
                <button onClick={handleCompaniesWithDateSales}>
                    Kayıt Getir
        </button>

                
              
            : "Bir tarih seçin"
        }
        <div>
            {console.log(companiesWithDateSales)}
            {
             
            Object.entries(companiesWithDateSales).map(([companyName, companyData], index) => {
        const items = flattenItems(companyData.items);

        return (
          <div key={index} className="sale-card">
            <h1>{companyName}</h1>
            <table style={{width:"50%"}}>
              <thead>
                <tr>
                  <th>Kod(*)</th>
                  <th>Miktar</th>
                  <th>Mal Fazlası İsk.</th>
                  <th>Fiyat(*)</th>
                  <th>İsk.1 Tip</th>
                  <th>İsk.1</th>
                  <th>İsk.2 Tip</th>
                  <th>İsk.2</th>
                  <th>KDV</th>
                  <th>Fiili Tarih</th>
                  <th>Fiyat Tipi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, itemIndex) => (
                  <tr key={item._id}>
                    <td>{item.code}</td>
                    <td>{item.quantity}</td>
                    <td></td>
                    <td>{item.price}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    {item.isDifferentPrice ? 2 : 1}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="button-container">
            <button onClick={() => downloadExcel(items, companyName, dateRange)}>İrsaliye Kaydını İndir</button>
              <button>İrsaliye Kaydını İndirildi Olarak İşaretle</button>
            </div>
          </div>
        );
      })}
            </div>
</div>
    );
  };

export default Download;