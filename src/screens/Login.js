import React, {useState} from 'react'
import {Button, Form, Modal} from 'react-bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import '../style/Welcome.css'

const blankUser = {email: '', password: '', check: ''}
const Login = (props) => {
    const {updateUser, setNetworks, setGateways, setAlert, dcmFetch} = props
    const [state, setState] = useState('login')
    const [user, setUser] = useState(blankUser)

    const newUser = () => {
        setState('new')
        setUser({...blankUser})
    }
    
    const submitLogin = () => {
        const body = {email: user.email, password: user.password}
        dcmFetch('auth', {method: 'POST', body}, rsUser => {
            if(rsUser.error)
                return setAlert('Login failed')
            updateUser(rsUser)
            dcmFetch('network', {headers:{'Authorization': `Bearer ${rsUser.token}`}}, rsNets => {
                if(rsNets.error)
                    return setAlert(`Error: ${rsNets.error}`)
                setNetworks(rsNets)  
            })
            dcmFetch('gateway', {headers:{'Authorization': `Bearer ${rsUser.token}`}}, rsGats => {
                if(rsGats.error)
                    return setAlert(`Error: ${rsGats.error}`)
                setGateways(rsGats)
            })
        })
    }

    const submitNewUser = () => {
        const body = {email: user.email, password: user.password}
        dcmFetch('user', {method: 'POST', body}, rs => {
            setState('login')
            if(rs.error)
                return setAlert(`Error: ${rs.error}`)
            submitLogin()
        })
    }
    
    const forgotPassword = () => {
        return setAlert('TODO: Forgot password')
    }

    const validateNewUser = () => {
        return user.email.length > 5 && user.password.length > 3 && user.password === user.check
            && user.email.toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
    }

    return (
        <>
            <Modal show={state === 'login'} dialogClassName="modal-welcome" centered>
                <Modal.Header>
                    <Modal.Title>Uploader Manager</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group style={{marginTop: 10, marginBottom:10}}>
                            <Form.Label>E-mail</Form.Label>
                            <Form.Control value={user.email} autoFocus size="sm" onChange={(e) => setUser({...user, email: e.target.value })} />
                        </Form.Group>
                        <Form.Group style={{marginTop: 10, marginBottom:10}}>
                            <Form.Label>Password</Form.Label>
                            <Form.Control type="password" value={user.password} size="sm" onChange={(e) => setUser({...user, password: e.target.value })} />
                        </Form.Group>
                        <Form.Group style={{marginTop: 10, marginBottom:10, textAlign:'right'}}>
                            <Button size="sm" variant="success" onClick={submitLogin}>Login</Button>
                        </Form.Group>
                        <Form.Group style={{marginTop: 10, marginBottom:10, display: 'flex'}}>
                            <Button size="sm" variant="outline-success" onClick={newUser} style={{marginRight:5, width:'40%'}}>Sign Up</Button>
                            <Button size="sm" variant="outline-success" onClick={forgotPassword} style={{marginLeft:5, width:'60%'}}>Forgot password?</Button>
                        </Form.Group>
                    </Form>
                </Modal.Body>
            </Modal>
            <Modal show={state === 'new'} onHide={() => setState('login')} dialogClassName="modal-new">
                <Modal.Header closeButton>
                    <Modal.Title>Sign up</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group style={{marginTop: 10, marginBottom:10}}>
                            <Form.Label>E-mail</Form.Label>
                            <Form.Control value={user.login} autoFocus size="sm" onChange={(e) => setUser({...user, email: e.target.value })} />
                            <Form.Text className="text-muted">*must be valid</Form.Text>
                        </Form.Group>
                        <Form.Group style={{marginTop: 10, marginBottom:10}}>
                            <Form.Label>Password</Form.Label>
                            <Form.Control type="password" value={user.password} size="sm" onChange={(e) => setUser({...user, password: e.target.value })} />
                            <Form.Text className="text-muted">*4+ characters</Form.Text>
                        </Form.Group>
                        <Form.Group style={{marginTop: 10, marginBottom:10}}>
                            <Form.Label>Confirm password</Form.Label>
                            <Form.Control type="password" value={user.check} size="sm" onChange={(e) => setUser({...user, check: e.target.value })} />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="success" disabled={!validateNewUser()} onClick={submitNewUser}>Create</Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}
export default Login
