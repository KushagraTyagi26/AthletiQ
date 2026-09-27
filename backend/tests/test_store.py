from pathlib import Path
import sys, tempfile, unittest
import pandas as pd
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from app.store import get_state

SOURCE=Path(__file__).resolve().parents[2]/'data'/'processed'/'cycling_lactate.csv'

class StoreTests(unittest.TestCase):
    def test_artifact_reused_and_refit_when_dataset_changes(self):
        with tempfile.TemporaryDirectory() as directory:
            artifact=Path(directory)/'model.joblib'
            csv=Path(directory)/'input.csv'
            csv.write_bytes(SOURCE.read_bytes())
            first=get_state(csv,'official',artifact)
            original_mtime=artifact.stat().st_mtime_ns
            second=get_state(csv,'official',artifact)
            self.assertEqual(first['metrics'],second['metrics'])
            self.assertEqual(original_mtime,artifact.stat().st_mtime_ns)
            frame=pd.read_csv(csv)
            frame.loc[0,'performance_score']+=0.2
            frame.to_csv(csv,index=False)
            third=get_state(csv,'official',artifact)
            self.assertNotEqual(first['model'].predict(pd.DataFrame({'training_load':[250]}))[0],third['model'].predict(pd.DataFrame({'training_load':[250]}))[0])

if __name__=='__main__':unittest.main()
