import * as CANNON from 'cannon-es'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

export default function loadAndAddTurret(modelPath, position, type, scale, turrets, fbxModels) {
    const loader = new FBXLoader();
  
    loader.load(modelPath, fbx => {
      const clonedFbx = fbx.clone();
  
      fbxModels.push(clonedFbx);
  
      clonedFbx.scale.set(scale, scale, scale);
      clonedFbx.position.copy(position);
  
      const turret = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
  
      const cannonTurretBody = new CANNON.Body({
        mass: 400, 
        shape: turret,
        position: new CANNON.Vec3(position.x, position.y, position.z)
      });
  
      cannonTurretBody.position.copy(position);
  
      world.addBody(cannonTurretBody);
      scene.add(clonedFbx);
  
      turrets.push({ body: cannonTurretBody, type });
    });
  }