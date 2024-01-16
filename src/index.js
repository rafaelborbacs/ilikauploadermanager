import ls from 'local-storage'
import ReactDOM from 'react-dom/client'
import React, {useState, useEffect} from 'react'
import {Modal, Spinner, Container, Alert} from 'react-bootstrap'
import ModalMsg from './components/ModalMsg'
import Login from './screens/Login'
import Welcome from './screens/Welcome'
import Network from './screens/Network'
import './style/index.css'

const baseUrl = process.env.REACT_APP_API
const Manager = (props) => {
    const [user, setUser] = useState(ls.get('user'))
    const [network, setNetwork] = useState()
    const [networks, setNetworks] = useState()
    const [gateway, setGateway] = useState()
    const [gateways, setGateways] = useState()
    const [screen, setScreen] = useState(user && user.token ? 'Welcome' : 'Login')
    const [loading, setLoadings] = useState(0)
    const [modal, setModal] = useState({ show: false })
    const [alert, setAlert] = useState(false)

    const setLoading = (boo) => setLoadings(Math.max(loading + (boo ? 1 : -1), 0))

    useEffect(() => { setTimeout(() => setAlert(false), 3000) }, [alert])

    const dcmFetch = (url, options, callback) => {
        setLoading(true)
        options.headers = {...options.headers, 'cache': 'no-cache', 'content-type': 'application/json'}
        if(user)
            options.headers.Authorization = `Bearer ${user.token}`
        if(options.body && typeof options.body === 'object')
            options.body = JSON.stringify(options.body)
        let rsError = null
        console.log('url', url, 'options', options)
        fetch(`${baseUrl}/${url}`, options)
        .then(response => {
            if(response.status === 401 && url !== 'unauth')
                logout()
            if(!response.ok)
                rsError = {status: response.status, error: true}
            if(response.body && callback)
                return response.json()
        })
        .then(data => rsError ? callback({...rsError, ...data}) : callback(data))
        .catch(error => {
            if(callback)
                callback(rsError ? {error: true, ...rsError} : {error: true})
        })
        .finally(() => setLoading(false))
    }
    
    const updateUser = (user) => {
        setUser(user)
        setModal(false)
        ls.clear()
        ls.set('user', user)
        setScreen('Welcome')
    }

    const openNetwork = (n) => {
        setNetwork(n)
        dcmFetch(`gateway?network=${n._id}`, {}, rs => {
            if(rs.error)
                return setAlert(`Error: ${rs.error}`)
            setGateways(rs)
            setScreen('Network')
        })
    }

    const logout = () => {
        setUser(false)
        setModal(false)
        ls.clear()
        setScreen('Login')
        if(user && user.token)
            dcmFetch('unauth', {method:'POST'})
    }
    
    const context = {user, network, setNetwork, networks, setNetworks, gateway, setGateway, gateways, setGateways, screen, setScreen, loading, setLoading, modal, setModal, alert, setAlert, dcmFetch, openNetwork, updateUser, logout}
    const screens = {Login: <Login {...context} />, Welcome: <Welcome {...context} />, Network: <Network {...context} />}
    
    return (
        <div id="base">
            <ModalMsg modal={modal} />
            <Modal show={loading > 0} dialogClassName="modal-loading" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} centered>
                <Modal.Body>
                    <Spinner animation="border" />
                </Modal.Body>
            </Modal>
            {
                alert && 
                    (
                        <Alert variant="danger" onClose={() => setAlert(false)} style={{textAlign:'center', padding:5}} dismissible>
                            <Alert.Heading>{alert}</Alert.Heading>
                        </Alert>
                    )
            }
            <Container id="container">
                {screens[screen]}
            </Container>
        </div>
    )
}
const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(<Manager />)
