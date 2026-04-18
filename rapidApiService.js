import axios from 'axios';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'virtual-number.p.rapidapi.com';

class RapidApiService {
  async getCountries() {
    const response = await axios.get(
      `https://${RAPIDAPI_HOST}/api/v1/e-sim/all-countries`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST
        }
      }
    );
    return response.data;
  }

  async getNumbers(countryCode) {
    const response = await axios.get(
      `https://${RAPIDAPI_HOST}/api/v1/e-sim/country-numbers?countryId=${countryCode}`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST
        }
      }
    );
    return response.data;
  }

  async getMessages(countryCode, number, page = 1) {
    const response = await axios.get(
      `https://${RAPIDAPI_HOST}/api/v1/e-sim/view-messages?countryId=${countryCode}&number=${number}&page=${page}`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST
        }
      }
    );
    return response.data;
  }
}

export default new RapidApiService();
