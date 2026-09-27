"""Degree-2 polynomial curve fitting with a held-out test-file evaluation."""
import numpy as np
import pandas as pd
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score

COLUMNS=['athlete_id','date','training_load','performance_score']
class DataError(ValueError):pass

def validate(raw):
 if not set(COLUMNS).issubset(raw.columns):raise DataError('Required columns: '+', '.join(COLUMNS))
 df=raw[COLUMNS].copy()
 df['date']=pd.to_datetime(df.date,errors='coerce')
 for c in ('training_load','performance_score'):df[c]=pd.to_numeric(df[c],errors='coerce')
 df=df.dropna(subset=COLUMNS)
 df=df[(df.training_load>0)&(df.training_load<=10000)]
 if len(df)<30 or df.athlete_id.nunique()<10 or df.training_load.nunique()<8:
  raise DataError('Need 30 valid rows, 10 distinct test/athlete IDs and 8 distinct loads.')
 return df

def estimator(degree):return make_pipeline(PolynomialFeatures(degree=degree,include_bias=False),LinearRegression())

def train(raw):
 df=validate(raw)
 # All measurements from one test ID are assigned to a single side of the split.
 split=GroupShuffleSplit(n_splits=1,test_size=.2,random_state=42)
 train_idx,test_idx=next(split.split(df,groups=df.athlete_id))
 train_df,test_df=df.iloc[train_idx],df.iloc[test_idx]
 model=estimator(2)
 model.fit(train_df[['training_load']],train_df.performance_score)
 baseline=estimator(1)
 baseline.fit(train_df[['training_load']],train_df.performance_score)
 pred=model.predict(test_df[['training_load']])
 lo,hi=float(train_df.training_load.min()),float(train_df.training_load.max())
 grid=np.linspace(lo,hi,100)
 curve=[{'load':round(float(x),2),'score':round(float(y),2)} for x,y in zip(grid,model.predict(pd.DataFrame({'training_load':grid})))]
 linear=model.named_steps['linearregression']
 a,b=linear.coef_
 metrics={'degree':2,'mae':round(float(mean_absolute_error(test_df.performance_score,pred)),3),
          'r2':round(float(r2_score(test_df.performance_score,pred)),3),
          'linear_mae':round(float(mean_absolute_error(test_df.performance_score,baseline.predict(test_df[['training_load']]))),3),
          'linear_r2':round(float(r2_score(test_df.performance_score,baseline.predict(test_df[['training_load']]))),3),
          'train_rows':len(train_df),'test_rows':len(test_df),'train_groups':train_df.athlete_id.nunique(),
          'test_groups':test_df.athlete_id.nunique(),'load_min':round(lo,2),'load_max':round(hi,2),
          'equation':f'Lactate = {linear.intercept_:.3f} + ({a:.5f} × power) + ({b:.7f} × power²)'}
 return df,model,metrics,curve
