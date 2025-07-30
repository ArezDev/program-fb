const axios = require('axios');

const getNumber5sim = async (country, operator) => {
  try {
    const response = await axios.get(
      `https://5sim.net/v1/user/buy/activation/${country}/${operator}/facebook`,
      {
        headers: {
          Authorization: `Bearer eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3Njk0MTc5NTIsImlhdCI6MTczNzg4MTk1MiwicmF5IjoiMDA5ZGFkYjcxN2Q3M2UyMzI3NWM2NzNlYWQxNjA5YzYiLCJzdWIiOjIxMzIwOTN9.hr7m3nwbd-_vA8FY1yoduAybTBE6KywX5Agipzmug97Ey4l8uiKvxkcRU7xEDJTmfrXuuDj6AWUjIz1iELldXxjdrtXNYgySLbSIWMvcV-wvqbIR5FGSkaWcY6Nm31if6OXn6FCGZqH0vhUQFqiqn05E0h6VE72DozxeRYyHhuVK9Mk_-_cGGPEdDwqZGgDfioc-U_Afvxee81R25ZQneqn5E507U_nYggXGiruU_Y21N-kXA2jzN7Nb4oIihRMbQ80-3rkB8u2iIFNoCXUkOl51NbzSUoWJ2-X78cO_yyEDy3aFL-bm6wyLjXfw5_uSGkfA9zqmlZkSD1VbPFNgvw`,
          Accept: 'application/json',
        },
      }
    );
    if (response?.data?.phone === undefined || response?.data?.id === undefined) {
      return null;
    }
    const phone = response?.data?.phone;
    const id = response?.data?.id;
    return `${phone}|${id}`;

  } catch (error) {
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
};

const getCode5sim = async (id, operation) => {
  
    const response = await axios.get(`https://5sim.net/v1/user/${operation}/${id}`, {
      headers: {
        Authorization: `Bearer eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3Njk0MTc5NTIsImlhdCI6MTczNzg4MTk1MiwicmF5IjoiMDA5ZGFkYjcxN2Q3M2UyMzI3NWM2NzNlYWQxNjA5YzYiLCJzdWIiOjIxMzIwOTN9.hr7m3nwbd-_vA8FY1yoduAybTBE6KywX5Agipzmug97Ey4l8uiKvxkcRU7xEDJTmfrXuuDj6AWUjIz1iELldXxjdrtXNYgySLbSIWMvcV-wvqbIR5FGSkaWcY6Nm31if6OXn6FCGZqH0vhUQFqiqn05E0h6VE72DozxeRYyHhuVK9Mk_-_cGGPEdDwqZGgDfioc-U_Afvxee81R25ZQneqn5E507U_nYggXGiruU_Y21N-kXA2jzN7Nb4oIihRMbQ80-3rkB8u2iIFNoCXUkOl51NbzSUoWJ2-X78cO_yyEDy3aFL-bm6wyLjXfw5_uSGkfA9zqmlZkSD1VbPFNgvw`,
        Accept: 'application/json'
      }
    });
    //return response?.data;
    if (operation === 'check') {
      if (response?.data && response?.data?.sms?.[0]?.code) {
        return response?.data?.sms?.[0]?.code;
      } else {
        return null;
      }
    } else if (operation === 'cancel') {
      const statusCancel = response?.data?.status;
      return { statusCancel };
    } else if (operation === 'finish') {
      const statusFinish = response?.data?.status;
      return { statusFinish };
    }
}

// getNumber().then(d=>{
//   console.log(d);
// });

module.exports = { getNumber5sim, getCode5sim };