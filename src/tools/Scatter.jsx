import React from 'react';
class Scatter extends React.Component {
    theme
    data
    constructor(props) {
        super(props)
        this.state = {}
        this.theme = this.props.theme
        this.data = this.props.data
    }

    render() {
        return (
            <div className='Scatter' style={{ position: 'absolute', ...this.theme }}></div>
        )
    }
}
export default Scatter;