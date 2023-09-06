import coordinates from '@/modules/Map/Coordinates'

/**
 * Created by wqy
 * Date 2023/2/17 15:04
 * Description
 */
export class Lines extends THREE.Curve {
    constructor( cartesianlist ) {
        super();
        this.cartesianlist=cartesianlist;
    }
    getPoint( t, optionalTarget = new THREE.Vector3() ) {
        let result=coordinates.GetCartesianBylerp(this.cartesianlist,t);

        return optionalTarget.set( result.x, result.y, result.z );
    }
}
