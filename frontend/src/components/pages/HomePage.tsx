import Button from '../atoms/Button';
import {useNavigate} from 'react-router';

export default function HomePage(){
    let navigate = useNavigate();
    return(
        <div>
            <p>Welcome to the Video Chat App</p>
            <Button onClick = {() => navigate('/room')}>Join Room</Button> 
        </div>
    );
}