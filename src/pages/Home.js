import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import styles from "../styles/home.module.css";
import hero from "../assets/hero.webp"
import bgimg from '../assets/bgimg.png';

import BestsellingPanel from "../components/home/bestsellingPanel";
import QuranPanel from "../components/home/quranPanel";
import ArtPanel from "../components/home/artPanel";
import KidsPanel from "../components/home/kidsPanel";

const Home = () => {
  const [activeTab, setActiveTab] = useState("bestselling");
  const navigate = useNavigate();

  const renderPanel = () => {
    switch (activeTab) {
      case "bestselling":
        return <BestsellingPanel />;
      case "quran":
        return <QuranPanel />;
      case "art":
        return <ArtPanel />;
      case "kids":
        return <KidsPanel />;
      default:
        return <BestsellingPanel />;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.herocont}>
      <img src={hero} alt="Hero Image" className={styles.hero} />
      </div>

      <div className={styles.productnav}>
        <span onClick={() => navigate("/products")} className={styles.all}>مـنـتـجـاتـنا</span>
        <div className={styles.subnav}>
        <span onClick={() => setActiveTab("bestselling")}>الأكــثر مبيــعاً</span>
        <span onClick={() => setActiveTab("quran")}>لوحات آيات قرآنية</span>
        <span onClick={() => setActiveTab("art")}>لوحات بطابع فنى </span>
        <span onClick={() => setActiveTab("kids")}>لوحات اطفـال</span>
        </div>
      </div>

      <div>
        {renderPanel()}
      </div>

      <p className={styles.introtitle}>فَـــذَكِّر إِنْ نَفَعَت الذِكْرَى</p>

      <div className={styles.introbody}>
        <p>نحنُ فِى رحــلةِ الحَياة نُخطىء أحيَــاناً، نَتَـعثـر، نَـقَـع، و رُبما نَتوه.. ولكنْ الذِكــرَى تَبقى نــوراً يُضىء طَريقــنا. هذا المشروع يَهدفُ إلى تَحويــل جُــدران بيوتِــنا إلى مَصدر إلهــام يَومي، يُذكــرنا بإيمَــاننا ويُقربــنا مِن اللّه.</p>
        <p>مَشروع "فَــذَكِّـر" هو مبادَرة فَنية إســلامِــية تُترجم كَلِمَــات اللّه تَعَالى و رَسُــولِه الكَــريم إلى لَوحَــاتٍ فَــنيةٍ مُــضـيئة، تَحــمِل في طَــياتِها مَــعانى التذكيــر والمــوعِظةِ الحَسَــنة.</p>
      </div>

      <img src={bgimg} className={styles.background} alt="Background Image"/>

      <div className={styles.faq}>
        <span className={styles.all}>الاسئلة الشائعة</span>
        <span>ما هى لوحات الكانفاس ؟</span>
        <span>ما هى لوحات الكانفاس ؟</span>
        <span>ما هى لوحات الكانفاس ؟</span>
      </div>

      <div className={styles.special}>
        <span>طلــب خــاص</span>

        <form method="post">
          <textarea placeholder="وصــــف اللــوحــة"></textarea>
          <select>
            <option>نــــوع الخــــامـــة</option>
          </select>
          <select>
            <option>المـــقـــاس</option>
          </select>
          <input type="file" placeholder="ملف مرفق"></input>
          <input type="text" placeholder="كـــود الخــصــم"></input>
          <button type="submit">إرســــــال</button>
        </form>
      </div>
    </div>
  );
};

export default Home;
