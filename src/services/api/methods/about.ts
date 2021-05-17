
import client from '../httpClient'

const about = () => client.get('about').json()

export default about
