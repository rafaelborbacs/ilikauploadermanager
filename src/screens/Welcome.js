import React, {useState, useEffect} from 'react'
import {Button, Form, Modal} from 'react-bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import '../style/Welcome.css'

const blankNetwork = {name: ''}
const Welcome = (props) => {
    const {user, networks, setNetworks, openNetwork, dcmFetch, setAlert} = props
    const [network, setNetwork] = useState(blankNetwork)
    const [state, setState] = useState('welcome')

    const updateNetworks = () => dcmFetch('network', {}, rs => {
        if(rs.error)
            return setAlert(`Error: ${rs.error}`)
        setNetworks(rs)
    })

    const newNetwork = () => {
        setNetwork({...blankNetwork})
        setState('new')
    }

    const submitNewNetwork = () => {
        dcmFetch('network', {method: 'POST', body: network}, rs => {
            if(rs.error)
                return setAlert(`Error: ${rs.error}`)
            updateNetworks()
            setState('welcome')
        })
    }

    useEffect(() => {
        if(user && user.token)
            updateNetworks()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user])

    return (
        <>
            <Modal show={state === 'welcome'} dialogClassName="modal-welcome" centered>
                <Modal.Header>
                    <Modal.Title>Uploader Manager</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group key='nnew'>
                            <Button variant="success" onClick={newNetwork} style={{width: '100%', marginBottom: 20}}>
                                New network
                            </Button>
                        </Form.Group>
                        {
                            networks && networks.map(n => 
                                <Form.Group key={`n-${n._id}`}>
                                    <Button variant="outline-success" onClick={() => openNetwork(n)} style={{width: '100%', marginBottom: 5}}>
                                        {n.name}
                                    </Button>
                                </Form.Group>
                            )
                        }
                    </Form>
                </Modal.Body>
            </Modal>
            <Modal show={state === 'new'} onHide={() => setState('welcome')} dialogClassName="modal-new">
                <Modal.Header closeButton>
                    <Modal.Title>New Network</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group style={{marginTop: 10, marginBottom:10}}>
                            <Form.Label>Name</Form.Label>
                            <Form.Control maxLength={24} defaultValue={network.name} onChange={(e) => setNetwork({...network, name: e.target.value })} />
                            <Form.Text className="text-muted">
                                {network.name.length} / 24
                            </Form.Text>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="success" disabled={network.name.length === 0} onClick={submitNewNetwork}>Create</Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}
export default Welcome
