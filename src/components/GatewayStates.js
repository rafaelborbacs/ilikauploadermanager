import React, {useEffect} from 'react'
import {Badge, Button} from 'react-bootstrap'

let to = null
const GatewayStates = (props) => {
    const {gateways, setGateways, dcmFetch, setAlert} = props
    
    useEffect(() => {
        if(to)
            clearTimeout(to)
        if(gateways){
            gateways.forEach(g => g.state = g.state ? g.state : 'o')
            if(gateways.length)
                to = setTimeout(updateStates, 10000)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gateways])

    const updateStates = () => dcmFetch('state', {}, rs => {
        if(rs.error)
            return setAlert(`Error on updating states: ${rs.error}`)
        let changed = false
        gateways.forEach(g => {
            const stateObject = rs.find(s => s.id === g.id)
            const s = stateObject ? stateObject.state : 'o'
            if(g.state !== s){
                g.state = s
                changed = true
            }
        })
        if(changed)
            setGateways([...gateways])
        to = setTimeout(updateStates, 10000)
    })
    
    return gateways.map(g => 
        <Button key={`s-${g.id}`} variant="light" onClick={updateStates}
            style={{padding: 5, margin: 5, width: 200, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            {g.name}
            <Badge style={{ padding: 5, display: 'flex', alignItems: 'center' }}
                bg={g.state === 'i' ? 'success' : g.state === 's' ? 'primary' : g.state === 'r' ? 'info' : 'danger'}>
                {g.state === 'i' ? 'idle' : g.state === 's' ? 'sending' : g.state === 'r' ? 'receiving' : 'offline'}
            </Badge>
        </Button>
    )
}
export default GatewayStates
