import React, {useState, useEffect} from 'react'
import {Button, Dropdown, Form, Modal} from 'react-bootstrap'
import ReactFlow, {Background, Controls, MarkerType} from 'reactflow'
import GatewayStates from '../components/GatewayStates'
import 'reactflow/dist/style.css'
import '../style/Network.css'

const randomPoint = () => Math.floor(20 + 300 * Math.random())
const blankGateway = {id:"", name:"", host:"", port:4242, protocol:"http", username:"", password:"", pacs: null}
let edges = []

const Network = (props) => {
    const {network, setNetwork, gateways, setGateways, gateway, setGateway, openNetwork, setScreen, dcmFetch, setModal, setAlert, logout} = props
    const [showGateway, setShowGateway] = useState(false)
    const [showNewGateway, setShowNewGateway] = useState(false)

    useEffect(() => {
        setTimeout(() => {
            const fit = document.querySelector('button[title="fit view"]')
            if(fit) fit.click() 
        }, 500)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [network, gateways])
    
    if(!network || !gateways) setScreen('Welcome')

    const newGateway = () => {
        setGateway({...blankGateway})
        setShowNewGateway(true)
    }
    
    const submitNewGateway = () => {
        gateway.data = {label: gateway.name}
        gateway.position = {x: randomPoint(), y: randomPoint()}
        gateway.connectable = true
        gateway.network = network._id
        gateway.peers = []
        gateway.style = gateway.pacs ? {background: 'lightblue'} : {}
        dcmFetch('gateway', {method:'POST', body: gateway}, rs => {
            setShowNewGateway(false)
            if(rs.error)
                return setAlert(`Error: ${rs.error}`)
            openNetwork(network)
        })
    }

    const openGateway = (myGateway) => {
        setGateway(myGateway)
        setShowGateway(true)
    }

    let x, y = 0
    const onNodeDragStart = (event, node) => {
        x = event.x
        y = event.y
    }

    const onNodeDragStop = (event, node) => {
        event.preventDefault()
        const dX = Math.floor((event.x - x) / 10)
        const dY = Math.floor((event.y - y) / 10)
        const myGateway = gateways.find(g => g.id === node.id)
        if(dX === 0 && dY === 0)
            return openGateway(myGateway)
        myGateway.position = {x: node.position.x + dX, y: node.position.y + dY}
        updateGateway(myGateway)
    }

    const updateGateway = (myGateway) => {
        myGateway.data = {label: myGateway.name}
        myGateway.style = myGateway.pacs ? {background: 'lightblue'} : {}
        dcmFetch('gateway', {method: 'PUT', body: myGateway}, rs => {
            setShowGateway(false)
            if(rs.error)
                return setAlert(`Error: ${rs.error}`)
            const newGateways = gateways.filter(g => g.id !== myGateway.id)
            newGateways.push(myGateway)
            setGateways(newGateways)
        })
    }

    const onConnect = (params) => {
        const source = gateways.find(g => g.id === params.source)
        source.peers = source.peers.filter(g => g !== params.target)
        source.peers.push(params.target)
        updateGateway(source)
    }
    
    const onEdgeClick = (event, edge) => {
        setModal({
            show: true, 
            title: 'Remove connection?', 
            text: edge.id, 
            handleOk: () => {
                setModal({show: false})
                const source = gateways.find(g => g.id === edge.source)
                source.peers = source.peers.filter(g => g !== edge.target)
                updateGateway(source)
            },
            handleCancel: () => setModal({show: false})
        })
    }

    const removeGateway = () => {
        setModal({
            show: true,
            title: `Remove gateway ${gateway.name}?`,
            text: 'Also removes its connections',
            handleOk: () => {
                dcmFetch('gateway', {method: 'DELETE', body: {id: gateway.id}}, rs => {
                    setShowGateway(false)
                    setModal({show: false})
                    if(rs.error)
                        return setAlert(`Error: ${rs.error}`)
                    const newGateways = gateways.filter(g => g.id !== gateway.id)
                    for(const g of newGateways){
                        if(g.peers.find(p => p === gateway.id)){
                            g.peers = g.peers.filter(p => p !== gateway.id)
                            dcmFetch('gateway', {method: 'PUT', body: g})
                        }
                    }
                    openNetwork(network)
                })
            },
            handleCancel: () => setModal({show: false})
        })
    }

    const formEdges = () => {
        edges = []
        gateways.forEach(source => {
            source.peers.forEach(target => {
                edges.push({
                    id: `${source.id} => ${target}`,
                    source: source.id,
                    target,
                    markerEnd: {type: MarkerType.ArrowClosed},
                    animated: true,
                    style: {stroke: 'blue'},
                    label: undefined
                })
            })
        })
        return edges
    }

    const exitNetwork = () => {
        setNetwork(null)
        setGateways(null)
        setScreen('Welcome')
    }

    return (
        <>
        {
            showNewGateway &&
            (
                <Modal show={showNewGateway} onHide={() => setShowNewGateway(false)} dialogClassName="modal-new">
                    <Modal.Header closeButton>
                        <Modal.Title>New Gateway</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group style={{marginTop: 10, marginBottom:10}}>
                            <Form.Label>ID</Form.Label>
                            <Form.Control maxLength={128} value={gateway.id} size="sm" onChange={(e) => setGateway({...gateway, id: e.target.value })} />
                            <Form.Text className="text-muted">
                                {gateway.id.length} / 128
                            </Form.Text>
                        </Form.Group>
                        <Form.Group style={{marginTop: 10, marginBottom:10}}>
                            <Form.Label>Name</Form.Label>
                            <Form.Control maxLength={32} value={gateway.name} size="sm" onChange={(e) => setGateway({...gateway, name: e.target.value })} />
                            <Form.Text className="text-muted">
                                {gateway.name.length} / 32
                            </Form.Text>
                        </Form.Group>
                        <Form.Group style={{marginTop: 10, marginBottom:10}}>
                            <Form.Label>Host</Form.Label>
                            <Form.Control maxLength={280} value={gateway.host} size="sm" onChange={(e) => setGateway({...gateway, host: e.target.value })} />
                            <Form.Text className="text-muted">
                                {gateway.host.length} / 280 * ex: 183.8.53.53 or domain.company.com
                            </Form.Text>
                        </Form.Group>
                        <Form.Group style={{marginTop: 10, marginBottom:10, display: 'flex', alignItems: 'flex-start'}}>
                            <div style={{width: 200}}>
                                <Form.Label>Port</Form.Label>
                                <Form.Control maxLength={5} value={gateway.port} size="sm" style={{width:100}}
                                    onChange={(e) => setGateway({...gateway, port: ~~parseInt(e.target.value.replace(/[^0-9]/g,'')) })} />
                            </div>
                            <div>
                                <Form.Label></Form.Label><br/>
                                <Form.Check style={{display:'inline-block', paddingRight:20}} label='http' name='protocol' value='http' type='radio' 
                                    defaultChecked={gateway.protocol === 'http'} onChange={(e) => setGateway({...gateway, protocol: e.target.value })} />
                                <Form.Check style={{display:'inline-block', paddingRight:20}} label='https' name='protocol' value='https' type='radio' 
                                    defaultChecked={gateway.protocol === 'https'} onChange={(e) => setGateway({...gateway, protocol: e.target.value })} />
                            </div>
                        </Form.Group>
                        <Form.Group style={{marginTop: 10, marginBottom:10, display: 'flex', alignItems: 'flex-start'}}>
                            <div style={{width: 200}}>
                                <Form.Label>Username</Form.Label>
                                <Form.Control maxLength={32} value={gateway.username} size="sm" style={{width:150}}
                                    onChange={(e) => setGateway({...gateway, username: e.target.value})} />
                                <Form.Text className="text-muted">
                                    {gateway.username.toString().length} / 32
                                </Form.Text>
                            </div>
                            <div>
                                <Form.Label>Password</Form.Label>
                                <Form.Control maxLength={32} value={gateway.password} size="sm" style={{width:150}}
                                    onChange={(e) => setGateway({...gateway, password: e.target.value})} />
                                <Form.Text className="text-muted">
                                    {gateway.password.toString().length} / 32
                                </Form.Text>
                            </div>
                        </Form.Group>
                        <Form.Group style={{marginTop: 10, marginBottom:10}}>
                            <Form.Check type="switch" label="Forward data to local PACS?" id="pacs" defaultChecked={gateway.pacs}
                                onChange={e => setGateway({...gateway, pacs: e.target.checked ? {host:"", port:4243, aetitle:"", callingaetitle:""} : null})} />
                        </Form.Group>
                        {
                            gateway.pacs && (
                                <>
                                    <Form.Group style={{marginBottom:10, display: 'flex', alignItems: 'flex-start'}}>
                                        <div style={{width: 300}}>
                                            <Form.Label>Host</Form.Label>
                                            <Form.Control maxLength={280} value={gateway.pacs.host} size="sm" style={{width:280}}
                                                onChange={(e) => setGateway({...gateway, pacs: {...gateway.pacs, host: e.target.value}})} />
                                        </div>
                                        <div>
                                            <Form.Label>Port</Form.Label>
                                            <Form.Control maxLength={5} value={gateway.pacs.port} size="sm" style={{width:100}}
                                                onChange={(e) => setGateway({...gateway, pacs: {...gateway.pacs, port: ~~parseInt(e.target.value.replace(/[^0-9]/g,''))}})} />
                                        </div>
                                    </Form.Group>
                                    <Form.Group style={{display: 'flex', alignItems: 'flex-start'}}>
                                        <div style={{width: 230}}>
                                            <Form.Label>AE Title</Form.Label>
                                            <Form.Control maxLength={16} value={gateway.pacs.aetitle} size="sm" style={{width: 170}}
                                                onChange={(e) => setGateway({...gateway, pacs: {...gateway.pacs, aetitle: e.target.value}})} />
                                        </div>
                                        <div>
                                            <Form.Label>Calling AE Title</Form.Label>
                                            <Form.Control maxLength={16} value={gateway.pacs.callingaetitle} size="sm" style={{width: 170}}
                                                onChange={(e) => setGateway({...gateway, pacs: {...gateway.pacs, callingaetitle: e.target.value}})} />
                                        </div>
                                    </Form.Group>
                                </>
                            )
                        }
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="success" size="sm" onClick={submitNewGateway} 
                            disabled={!gateway.name || !gateway.host || !gateway.port || (gateway.pacs && (!gateway.pacs.host || !gateway.pacs.port))}>
                            Create
                        </Button>
                    </Modal.Footer>
                </Modal>
            )
        }
        {
            showGateway &&
            (
               <Modal show={showGateway} onHide={() => setShowGateway(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>{gateway.name}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group style={{marginTop: 10, marginBottom:10}}>
                            <Form.Label>ID</Form.Label>
                            <Form.Control value={gateway.id} size="sm" disabled/>
                        </Form.Group>
                        <Form.Group style={{marginTop: 10, marginBottom:10}}>
                            <Form.Label>Name</Form.Label>
                            <Form.Control maxLength={32} value={gateway.name} size="sm" onChange={(e) => setGateway({...gateway, name: e.target.value })} />
                            <Form.Text className="text-muted">
                                {gateway.name.length} / 32
                            </Form.Text>
                        </Form.Group>
                        <Form.Group style={{marginTop: 10, marginBottom:10}}>
                            <Form.Label>Host</Form.Label>
                            <Form.Control maxLength={280} value={gateway.host} size="sm" onChange={(e) => setGateway({...gateway, host: e.target.value })} />
                            <Form.Text className="text-muted">
                                {gateway.host.length} / 280 * ex: 183.8.53.53 or domain.company.com
                            </Form.Text>
                        </Form.Group>
                        <Form.Group style={{marginTop: 10, marginBottom:10, display: 'flex', alignItems: 'flex-start'}}>
                            <div style={{width: 200}}>
                                <Form.Label>Port</Form.Label>
                                <Form.Control maxLength={5} value={gateway.port} size="sm" style={{width:100}}
                                    onChange={(e) => setGateway({...gateway, port: ~~parseInt(e.target.value.replace(/[^0-9]/g,'')) })} />
                            </div>
                            <div>
                                <Form.Label></Form.Label><br/>
                                <Form.Check style={{display:'inline-block', paddingRight:20}} label='http' name='protocol' value='http' type='radio' 
                                    defaultChecked={gateway.protocol === 'http'} onChange={(e) => setGateway({...gateway, protocol: e.target.value })} />
                                <Form.Check style={{display:'inline-block', paddingRight:20}} label='https' name='protocol' value='https' type='radio' 
                                    defaultChecked={gateway.protocol === 'https'} onChange={(e) => setGateway({...gateway, protocol: e.target.value })} />
                            </div>
                        </Form.Group>
                        <Form.Group style={{marginTop: 10, marginBottom:10, display: 'flex', alignItems: 'flex-start'}}>
                            <div style={{width: 200}}>
                                <Form.Label>Username</Form.Label>
                                <Form.Control maxLength={32} value={gateway.username} size="sm" style={{width:150}}
                                    onChange={(e) => setGateway({...gateway, username: e.target.value})} />
                                <Form.Text className="text-muted">
                                    {gateway.username.toString().length} / 32
                                </Form.Text>
                            </div>
                            <div>
                                <Form.Label>Password</Form.Label>
                                <Form.Control maxLength={32} value={gateway.password} size="sm" style={{width:150}}
                                    onChange={(e) => setGateway({...gateway, password: e.target.value})} />
                                <Form.Text className="text-muted">
                                    {gateway.password.toString().length} / 32
                                </Form.Text>
                            </div>
                        </Form.Group>
                        <Form.Group style={{marginTop: 10, marginBottom:10}}>
                            <Form.Check type="switch" label="Forward data to local PACS?" id="pacs" defaultChecked={gateway.pacs}
                                onChange={e => setGateway({...gateway, pacs: e.target.checked ? {host:"", port:4243, aetitle:"", callingaetitle:""} : null})} />
                        </Form.Group>
                        {
                            gateway.pacs && (
                                <>
                                    <Form.Group style={{marginBottom:10, display: 'flex', alignItems: 'flex-start'}}>
                                        <div style={{width: 300}}>
                                            <Form.Label>Host</Form.Label>
                                            <Form.Control maxLength={280} value={gateway.pacs.host} size="sm" style={{width:280}}
                                                onChange={(e) => setGateway({...gateway, pacs: {...gateway.pacs, host: e.target.value}})} />
                                        </div>
                                        <div>
                                            <Form.Label>Port</Form.Label>
                                            <Form.Control maxLength={5} value={gateway.pacs.port} size="sm" style={{width:100}}
                                                onChange={(e) => setGateway({...gateway, pacs: {...gateway.pacs, port: ~~parseInt(e.target.value.replace(/[^0-9]/g,''))}})} />
                                        </div>
                                    </Form.Group>
                                    <Form.Group style={{display: 'flex', alignItems: 'flex-start'}}>
                                        <div style={{width: 230}}>
                                            <Form.Label>AE Title</Form.Label>
                                            <Form.Control maxLength={16} value={gateway.pacs.aetitle} size="sm" style={{width: 170}}
                                                onChange={(e) => setGateway({...gateway, pacs: {...gateway.pacs, aetitle: e.target.value}})} />
                                        </div>
                                        <div>
                                            <Form.Label>Calling AE Title</Form.Label>
                                            <Form.Control maxLength={16} value={gateway.pacs.callingaetitle} size="sm" style={{width: 170}}
                                                onChange={(e) => setGateway({...gateway, pacs: {...gateway.pacs, callingaetitle: e.target.value}})} />
                                        </div>
                                    </Form.Group>
                                </>
                            )
                        }
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="danger" size="sm" onClick={removeGateway}>Delete</Button>
                        <Button variant="success" size="sm" onClick={() => updateGateway(gateway)}
                            disabled={!gateway.name || !gateway.host || !gateway.port || (gateway.pacs && (!gateway.pacs.host || !gateway.pacs.port))}>
                            Save
                        </Button>
                    </Modal.Footer>
                </Modal>
            )
        }
            <Dropdown>
                <Dropdown.Toggle className="custom-dropdown-toggle">≡</Dropdown.Toggle>
                <Dropdown.Menu>
                    <Dropdown.Item onClick={newGateway}>
                        <strong>New Gateway</strong>
                    </Dropdown.Item>
                    <Dropdown.Item onClick={exitNetwork}>
                        <strong>Exit Network</strong>
                    </Dropdown.Item>
                    <Dropdown.Item onClick={logout}>
                        <strong>Logout</strong>
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
            <div style={{display: 'flex', height: '100%', padding: 0, margin: 0}}>
                <div style={{flexGrow: 1}}>
                    <ReactFlow id="flow" nodes={gateways} edges={formEdges()} onNodeDragStart={onNodeDragStart} onNodeDragStop={onNodeDragStop}
                        onConnect={onConnect} onEdgeClick={onEdgeClick} style={{height: '100%', width: '100%'}} >
                        <Background />
                        <Controls />
                    </ReactFlow>
                </div>
                <div style={{ width: 200, paddingLeft: 10 }}>
                    <GatewayStates {...props} />
                </div>
            </div>
        </>
    )
}
export default Network
