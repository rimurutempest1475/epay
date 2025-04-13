import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const ParticleEffect = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Tạo scene
    const scene = new THREE.Scene();

    // Tạo camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 50;

    // Tạo renderer với antialias để làm mịn cạnh
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);

    // Tạo hình dạng cánh hoa
    const createPetal = () => {
      const shape = new THREE.Shape();
      
      // Vẽ hình cánh hoa mềm mại hơn
      shape.moveTo(0, 0);
      shape.bezierCurveTo(2, 1, 3, 2, 0, 6);
      shape.bezierCurveTo(-3, 2, -2, 1, 0, 0);

      const geometry = new THREE.ShapeGeometry(shape);
      return geometry;
    };

    // Tạo group chứa tất cả các cánh hoa
    const petalGroup = new THREE.Group();
    const petalCount = 150; // Tăng số lượng cánh hoa
    const petals = [];

    // Định nghĩa các màu sắc phù hợp với theme
    const colors = [
      new THREE.Color(0xE78A8C), // Màu chủ đạo
      new THREE.Color(0xF0A5A7), // Màu hồng nhạt hơn
      new THREE.Color(0xDE7072), // Màu hồng đậm hơn
    ];

    // Tạo texture gradient cho cánh hoa
    const createPetalMaterial = (color) => {
      return new THREE.MeshPhongMaterial({
        color: color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        shininess: 40,
        specular: 0x444444,
      });
    };

    // Thêm ánh sáng
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Tạo nhiều cánh hoa và đặt vị trí ngẫu nhiên
    for (let i = 0; i < petalCount; i++) {
      const petalGeometry = createPetal();
      // Chọn màu ngẫu nhiên từ mảng màu
      const color = colors[Math.floor(Math.random() * colors.length)];
      const petal = new THREE.Mesh(petalGeometry, createPetalMaterial(color));

      // Vị trí ngẫu nhiên trong không gian rộng hơn
      petal.position.set(
        (Math.random() - 0.5) * 120,
        (Math.random() - 0.5) * 120,
        (Math.random() - 0.5) * 80
      );

      // Xoay ngẫu nhiên
      petal.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      // Kích thước ngẫu nhiên nhưng nhỏ hơn
      const scale = Math.random() * 0.4 + 0.3;
      petal.scale.set(scale, scale, scale);

      // Lưu thông tin chuyển động cho mỗi cánh hoa
      petals.push({
        mesh: petal,
        speed: Math.random() * 0.015 + 0.008, // Tốc độ rơi chậm hơn
        rotationSpeed: {
          x: (Math.random() - 0.5) * 0.015,
          y: (Math.random() - 0.5) * 0.015,
          z: (Math.random() - 0.5) * 0.015
        },
        windEffect: Math.random() * 0.005 // Thêm hiệu ứng gió
      });

      petalGroup.add(petal);
    }

    scene.add(petalGroup);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      const time = Date.now() * 0.001; // Thời gian cho hiệu ứng gió

      petals.forEach(petal => {
        // Di chuyển cánh hoa xuống và xoay
        petal.mesh.position.y -= petal.speed;
        // Thêm chuyển động theo gió
        petal.mesh.position.x += Math.sin(time) * petal.windEffect;
        petal.mesh.position.z += Math.cos(time) * petal.windEffect;

        petal.mesh.rotation.x += petal.rotationSpeed.x;
        petal.mesh.rotation.y += petal.rotationSpeed.y;
        petal.mesh.rotation.z += petal.rotationSpeed.z;

        // Nếu cánh hoa rơi quá thấp, đưa lên trên lại
        if (petal.mesh.position.y < -60) {
          petal.mesh.position.y = 60;
          petal.mesh.position.x = (Math.random() - 0.5) * 120;
          petal.mesh.position.z = (Math.random() - 0.5) * 80;
        }
      });

      // Thêm chuyển động nhẹ cho toàn bộ group
      petalGroup.rotation.y += 0.0005;

      renderer.render(scene, camera);
    };

    animate();

    // Xử lý resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      
      // Dispose resources
      petals.forEach(petal => {
        petal.mesh.geometry.dispose();
        petal.mesh.material.dispose();
      });
      renderer.dispose();
      
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0
      }}
    />
  );
};

export default ParticleEffect; 