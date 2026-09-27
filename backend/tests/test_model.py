import sys
from pathlib import Path
import unittest
import pandas as pd
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from app.model import train,DataError

DATA=Path(__file__).resolve().parents[2]/'data'/'processed'/'cycling_lactate.csv'

class ModelTests(unittest.TestCase):
    def test_real_dataset_training_and_group_holdout(self):
        df,model,metrics,curve=train(pd.read_csv(DATA))
        self.assertEqual(len(df),metrics['train_rows']+metrics['test_rows'])
        self.assertEqual(metrics['degree'],2)
        self.assertGreater(metrics['r2'],metrics['linear_r2'])
        self.assertEqual(len(curve),100)
        self.assertGreaterEqual(metrics['mae'],0)
    def test_missing_target_rejected(self):
        raw=pd.read_csv(DATA).drop(columns=['performance_score'])
        with self.assertRaises(DataError):train(raw)

if __name__=='__main__':unittest.main()
